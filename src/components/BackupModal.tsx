import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  HardDrive, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import type { FlatRecord } from '../types.ts';
import { backupFlatsToGoogleSheets, exportFlatsToCSV } from '../services/googleSheets.ts';
import { reauthorizeGoogleDrive } from '../firebase.ts';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatRecord[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  flats,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [backupResult, setBackupResult] = useState<{
    success: boolean;
    url?: string;
    error?: string;
    needsReauth?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartBackup = async (overrideToken?: string) => {
    setIsBackingUp(true);
    setBackupResult(null);

    const res = await backupFlatsToGoogleSheets(flats, overrideToken);
    setIsBackingUp(false);
    if (res.success && res.spreadsheetUrl) {
      setBackupResult({ success: true, url: res.spreadsheetUrl });
    } else {
      setBackupResult({ 
        success: false, 
        error: res.error || 'Failed to sync with Google Drive.',
        needsReauth: res.needsReauth 
      });
    }
  };

  const handleReauthorize = async () => {
    setIsReauthorizing(true);
    try {
      const freshToken = await reauthorizeGoogleDrive();
      // Automatically proceed with backup using the new token
      await handleStartBackup(freshToken);
    } catch (err: any) {
      console.error('Re-auth error:', err);
      setBackupResult({
        success: false,
        needsReauth: true,
        error: 'Google Drive permission was not granted. Please approve the permission in the popup to enable backup.',
      });
    } finally {
      setIsReauthorizing(false);
    }
  };

  const handleExportCSV = () => {
    exportFlatsToCSV(flats);
  };

  return (
    <div 
      id="backup-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={isBackingUp || isReauthorizing ? undefined : onClose}
    >
      <div 
        id="backup-modal-container"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1B262C]">Google Drive & Sheets Backup</h3>
              <p className="text-xs text-gray-500">Synchronize {flats.length} property records</p>
            </div>
          </div>

          <button
            id="close-backup-modal-btn"
            type="button"
            onClick={onClose}
            disabled={isBackingUp || isReauthorizing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#F5F2ED] transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4 text-sm text-gray-800">
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>TOTAL RECORDS TO EXPORT</span>
              <span className="text-sm font-bold text-[#1B262C] px-2.5 py-0.5 rounded-full bg-gray-200">
                {flats.length} Flats
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Backing up will create a new Google Sheet inside your personal Google Drive containing all 5 data sections for every property recorded by your team.
            </p>
          </div>

          {backupResult?.success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-sm">Backup Created Successfully!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Your properties sheet has been safely created in Google Drive with all 33 columns populated.
              </p>
              <a
                id="open-created-sheet-btn"
                href={backupResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#1B262C] text-white hover:bg-[#2C3E50] text-sm font-semibold transition shadow-xs"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Re-authorization Prompt if Scopes are missing or expired */}
          {backupResult?.needsReauth && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900">Google Drive & Sheets Access Permission Required</h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    {backupResult.error || 'Your Google account session is missing permission for Google Sheets and Google Drive (insufficient scopes). Please click below to grant access and complete the backup.'}
                  </p>
                </div>
              </div>
              <button
                id="reauthorize-google-drive-btn"
                type="button"
                onClick={handleReauthorize}
                disabled={isReauthorizing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1B262C] text-white hover:bg-[#2C3E50] text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {isReauthorizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting & Requesting Permission...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-[#D35400]" />
                    <span>Grant Google Drive & Sheets Access</span>
                  </>
                )}
              </button>
            </div>
          )}

          {backupResult?.error && !backupResult.needsReauth && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Backup Encountered an Issue</p>
                  <p className="mt-1 text-rose-800">{backupResult.error}</p>
                </div>
              </div>
              <p className="text-gray-600 mt-2 pt-2 border-t border-rose-200/60">
                Tip: You can use the instant <strong>Export CSV</strong> button below anytime as an offline fallback.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              id="start-drive-backup-btn"
              type="button"
              onClick={() => handleStartBackup()}
              disabled={isBackingUp || isReauthorizing || flats.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D35400] text-white hover:bg-[#B84500] active:bg-[#9C3A00] text-sm font-semibold transition shadow-xs min-h-[48px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Google Sheets & Syncing...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Backup to Google Drive / Sheets</span>
                </>
              )}
            </button>

            <button
              id="modal-export-csv-btn"
              type="button"
              onClick={handleExportCSV}
              disabled={flats.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-[#FAF9F6] text-sm font-semibold transition min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>Download / Export as CSV File</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 flex justify-end">
          <button
            id="close-backup-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-[#F5F2ED] transition cursor-pointer min-h-[36px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
