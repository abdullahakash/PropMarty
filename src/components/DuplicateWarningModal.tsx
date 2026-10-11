import React from 'react';
import { AlertCircle, Phone, ArrowRight, X, ExternalLink } from 'lucide-react';
import type { FlatRecord } from '../types.ts';
import { getFlatDisplayTitle } from '../types.ts';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  phoneNumber: string;
  existingFlat: FlatRecord | null;
  onSaveAnyway: () => void;
  onOpenExisting: (flat: FlatRecord) => void;
  onCancel: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  phoneNumber,
  existingFlat,
  onSaveAnyway,
  onOpenExisting,
  onCancel,
}) => {
  if (!isOpen || !existingFlat) return null;

  const displayTitle = getFlatDisplayTitle(existingFlat);

  return (
    <div 
      id="duplicate-warning-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div 
        id="duplicate-warning-modal"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 overflow-hidden text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              Duplicate Phone Number
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              An entry with this phone number already exists. Save anyway?
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Flat Preview Card */}
        <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-gray-200/90 mb-5 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold text-[#D35400]">
              {existingFlat.propertyType || 'Ready Flat'}
            </span>
            <span className="font-mono bg-gray-200/60 px-1.5 py-0.5 rounded text-[10px]">
              {phoneNumber}
            </span>
          </div>
          <div className="font-bold text-gray-900 text-sm truncate">
            {displayTitle}
          </div>
          {existingFlat.location && existingFlat.location !== displayTitle && (
            <div className="text-gray-600 truncate">
              Location: {existingFlat.location}
            </div>
          )}
          {(existingFlat.ownerName || existingFlat.developerName || existingFlat.contactPerson) && (
            <div className="text-gray-600 truncate">
              Contact: {existingFlat.ownerName || existingFlat.developerName || existingFlat.contactPerson}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            id="btn-save-duplicate-anyway"
            type="button"
            onClick={onSaveAnyway}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1B262C] text-white hover:bg-[#2C3E50] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>Save Anyway</span>
          </button>

          <button
            id="btn-open-existing-entry"
            type="button"
            onClick={() => onOpenExisting(existingFlat)}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#D35400] text-[#D35400] hover:bg-[#FFF6F0] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Existing Entry</span>
          </button>

          <button
            id="btn-cancel-duplicate-modal"
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
