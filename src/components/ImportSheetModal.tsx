import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  KeyRound,
  PlusCircle,
  FileEdit,
  Check,
  UploadCloud
} from 'lucide-react';
import type { FlatRecord } from '../types.ts';
import { 
  readFlatsFromGoogleSheet, 
  compareSheetWithFirestore, 
  getLastBackupSheet,
  type SheetComparisonResult,
  rowToFlat
} from '../services/googleSheets.ts';
import { reauthorizeGoogleDrive, batchSaveFlats } from '../firebase.ts';

interface ImportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFlats: FlatRecord[];
  onImportComplete: (message: string) => void;
  currentUser: User;
}

export const ImportSheetModal: React.FC<ImportSheetModalProps> = ({
  isOpen,
  onClose,
  existingFlats,
  onImportComplete,
  currentUser,
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<SheetComparisonResult | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Pre-fill with last backup URL if available
  useEffect(() => {
    if (isOpen) {
      const last = getLastBackupSheet();
      if (last.url && !sheetUrl) {
        setSheetUrl(last.url);
      }
      setComparisonResult(null);
      setErrorMessage(null);
      setNeedsReauth(false);
      setImportSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanSheet = async (overrideToken?: string) => {
    if (!sheetUrl.trim()) {
      setErrorMessage('Please enter a Google Sheet link or Spreadsheet ID to scan.');
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setNeedsReauth(false);
    setComparisonResult(null);
    setImportSuccessMessage(null);

    const result = await readFlatsFromGoogleSheet(sheetUrl.trim(), overrideToken);
    setIsScanning(false);

    if (!result.success || !result.rows) {
      if (result.needsReauth) {
        setNeedsReauth(true);
      }
      setErrorMessage(result.error || 'Could not fetch data from the provided Google Sheet.');
      return;
    }

    setSpreadsheetTitle(result.spreadsheetTitle || 'Google Sheet');
    const diff = compareSheetWithFirestore(result.rows, existingFlats);
    setComparisonResult(diff);
  };

  const handleReauthorize = async () => {
    setIsReauthorizing(true);
    try {
      const freshToken = await reauthorizeGoogleDrive();
      setNeedsReauth(false);
      await handleScanSheet(freshToken);
    } catch (err: any) {
      console.error('Re-auth error:', err);
      let message = 'Google Drive permission was not granted. Please approve permission to continue.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Permission window was closed. Please try again when you are ready.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Permission request was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'The permission popup was blocked by your browser. Please allow popups for this site.';
      }
      setErrorMessage(message);
    } finally {
      setIsReauthorizing(false);
    }
  };

  // Handle CSV file upload fallback
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        const rows = lines.map(line => {
          // Parse CSV with quotes
          const row: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              row.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          row.push(current);
          return row;
        });

        setSpreadsheetTitle(file.name);
        const diff = compareSheetWithFirestore(rows, existingFlats);
        setComparisonResult(diff);
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!comparisonResult) return;

    const { newFlats, modifiedFlats } = comparisonResult;
    if (newFlats.length === 0 && modifiedFlats.length === 0) return;

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const flatsToCreate = newFlats.map((item) => item.flat as Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'>);
      const flatsToUpdate = modifiedFlats.map((item) => ({
        id: item.existingId!,
        data: item.flat,
      }));

      await batchSaveFlats(flatsToCreate, flatsToUpdate, currentUser.uid, currentUser.email || '');

      const successMsg = `Successfully imported ${newFlats.length} new properties and updated ${modifiedFlats.length} existing records in Firestore!`;
      setImportSuccessMessage(successMsg);
      onImportComplete(successMsg);
      
      // Auto-close after short delay
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error importing to Firestore:', err);
      setErrorMessage(err.message || 'Failed to save imported properties to Firestore.');
    } finally {
      setIsImporting(false);
    }
  };

  const totalChanges = comparisonResult 
    ? comparisonResult.newFlats.length + comparisonResult.modifiedFlats.length 
    : 0;

  return (
    <div 
      id="import-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={isScanning || isImporting || isReauthorizing ? undefined : onClose}
    >
      <div 
        id="import-modal-container"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1B262C]">Import from Google Sheet</h3>
              <p className="text-xs text-gray-500">Sync bulk edits from Google Sheets back into Firestore</p>
            </div>
          </div>

          <button
            id="close-import-modal-btn"
            type="button"
            onClick={onClose}
            disabled={isScanning || isImporting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#F5F2ED] transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-sm text-gray-800">
          {/* Instructions */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-gray-200 text-xs text-gray-600 leading-relaxed">
            Paste the Google Sheet link that contains your property records. PropMarty will scan the rows, detect new or changed records, show you a preview diff, and write them directly into your Firestore database.
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label htmlFor="sheet-url-input" className="block text-xs uppercase tracking-wider font-bold text-gray-600">
              Google Sheet URL or Spreadsheet ID
            </label>
            <div className="flex gap-2">
              <input
                id="sheet-url-input"
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                disabled={isScanning || isImporting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAF9F6] text-[#1B262C] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400]/25 focus:border-[#D35400] text-sm min-h-[44px]"
              />
              <button
                id="scan-sheet-btn"
                type="button"
                onClick={() => handleScanSheet()}
                disabled={isScanning || isImporting || !sheetUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#1B262C] text-white hover:bg-[#2C3E50] text-sm font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-shrink-0"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <span>Scan Sheet</span>
                )}
              </button>
            </div>
          </div>

          {/* Re-auth Warning */}
          {needsReauth && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900">Google Drive Permission Required</h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Reading this Google Sheet requires authorization. Click the button below to grant read access to your Google Drive files.
                  </p>
                </div>
              </div>
              <button
                id="import-reauth-btn"
                type="button"
                onClick={handleReauthorize}
                disabled={isReauthorizing}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#1B262C] text-white hover:bg-[#2C3E50] text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {isReauthorizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-[#D35400]" />
                    <span>Grant Google Drive Read Access</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !needsReauth && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {importSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-semibold">{importSuccessMessage}</span>
            </div>
          )}

          {/* Scan Results & Diff Preview */}
          {comparisonResult && !importSuccessMessage && (
            <div className="space-y-3 pt-1">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-lg font-bold text-emerald-700">
                    +{comparisonResult.newFlats.length}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-800">New Flats</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">
                    {comparisonResult.modifiedFlats.length}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-800">Modified Rows</div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-lg font-bold text-gray-600">
                    {comparisonResult.unchangedCount}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500">Unchanged</div>
                </div>
              </div>

              {/* No Changes State */}
              {totalChanges === 0 && (
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-gray-200 text-center py-6 text-gray-600 space-y-1">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-sm text-[#1B262C]">Everything is in Sync</p>
                  <p className="text-xs">Your Firestore database already has all records identical to this Google Sheet.</p>
                </div>
              )}

              {/* Changes Preview List */}
              {totalChanges > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Changes to Apply ({totalChanges} items):
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
                    {/* New Flats List */}
                    {comparisonResult.newFlats.map((item, idx) => (
                      <div key={`new-${idx}`} className="pt-2 first:pt-0 flex items-start gap-2 text-xs">
                        <PlusCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold text-[#1B262C]">
                            {item.flat.location || 'Untitled Location'}
                          </span>
                          <span className="text-gray-500 ml-1.5">
                            ({item.flat.phoneNumber || 'No phone'})
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            NEW
                          </span>
                          {item.flat.askingPrice && (
                            <span className="block text-[11px] text-gray-600 mt-0.5">
                              Asking: ৳ {Number(item.flat.askingPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Modified Flats List */}
                    {comparisonResult.modifiedFlats.map((item, idx) => (
                      <div key={`mod-${idx}`} className="pt-2 first:pt-0 flex items-start gap-2 text-xs">
                        <FileEdit className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#1B262C]">
                              {item.flat.location || 'Updated Property'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {item.changes?.length} field{item.changes && item.changes.length > 1 ? 's' : ''} updated
                            </span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {item.changes?.map((ch, cIdx) => (
                              <div key={cIdx} className="text-[11px] text-gray-600 flex items-center gap-1">
                                <span className="font-medium text-gray-700">{ch.label}:</span>
                                <span className="line-through text-gray-400">{String(ch.oldValue || '—')}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span className="font-semibold text-amber-800">{String(ch.newValue || '—')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confirmation Button */}
                  <button
                    id="confirm-import-btn"
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D35400] text-white hover:bg-[#B84500] active:bg-[#9C3A00] text-sm font-semibold transition shadow-xs cursor-pointer disabled:opacity-50 min-h-[48px]"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Importing to Firestore Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Import ({totalChanges} Changes) into Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fallback: CSV Upload */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Or upload a downloaded CSV sheet:</span>
            <label className="font-semibold text-[#D35400] hover:underline cursor-pointer flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Select CSV File</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCSVUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 flex justify-end">
          <button
            id="close-import-footer-btn"
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-[#F5F2ED] transition cursor-pointer min-h-[36px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
