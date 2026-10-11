import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DiscardChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  isEdit?: boolean;
}

export const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
  isOpen,
  onCancel,
  onDiscard,
  onSave,
  isEdit = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-4 text-rose-600">
          <AlertCircle className="w-8 h-8" />
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Discard changes?' : 'Discard this entry?'}
          </h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          You have unsaved changes. What would you like to do?
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            className="w-full py-3 rounded-xl bg-[#D35400] text-white font-bold text-sm cursor-pointer"
          >
            Save changes
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-transparent text-gray-600 font-semibold text-sm cursor-pointer"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};
