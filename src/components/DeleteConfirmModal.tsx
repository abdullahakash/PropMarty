import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { FlatRecord } from '../types.ts';

interface DeleteConfirmModalProps {
  flat: FlatRecord | null;
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  flat,
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen || !flat) return null;

  return (
    <div 
      id="delete-confirm-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={isDeleting ? undefined : onCancel}
    >
      <div 
        id="delete-confirm-modal-container"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1B262C]">Confirm Delete</h3>
            <p className="text-xs text-gray-500">This action will permanently remove the record.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF9F6] border border-gray-200 my-4 text-sm text-gray-800">
          <p className="font-bold text-base text-[#1B262C] mb-1">
            {flat.location}
          </p>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>Owner: <span className="font-semibold text-gray-800">{flat.ownerName || 'N/A'}</span></p>
            <p>Phone: <span className="font-mono font-semibold text-gray-800">{flat.phoneNumber}</span></p>
            <p>Collected by: <span className="font-semibold text-gray-800">{flat.collectedBy}</span></p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this flat entry from the team workspace? This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-[#F5F2ED] text-sm font-semibold transition min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Flat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
