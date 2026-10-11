import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  User, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Home, 
  Edit3, 
  Trash2, 
  Copy, 
  PlusCircle,
  HardHat,
  Share2,
  Check
} from 'lucide-react';
import type { FlatRecord, ListingStatus, ContactStatus } from '../types.ts';
import { 
  getFlatDisplayTitle, 
  getMissingRequiredFields, 
  formatBangladeshiCroreLakh,
  resolveDrawingDining,
  resolveFacingDirections
} from '../types.ts';
import { getStatusBadgeStyle } from './FlatCard.tsx';

interface FlatDetailModalProps {
  flat: FlatRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (flat: FlatRecord) => void;
  onDelete: (flat: FlatRecord) => void;
  onDuplicate: (flat: FlatRecord) => void;
  onStatusChange?: (flatId: string, status: ListingStatus) => void;
  onContactStatusChange?: (flatId: string, status: ContactStatus) => void;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

export function getSummaryText(flat: FlatRecord): string {
  const parts: string[] = [];
  const title = getFlatDisplayTitle(flat);
  const locParts = [title, flat.area, flat.location].filter(Boolean);
  const uniqueLoc = Array.from(new Set(locParts));
  if (uniqueLoc.length > 0) {
    parts.push(uniqueLoc.join(', '));
  }

  const sizeStr = flat.flatSize ? `${flat.flatSize.toLocaleString()} sq ft` : '';
  const bedStr = flat.bedrooms ? `${flat.bedrooms} bed` : '';
  const bathStr = flat.bathrooms ? `${flat.bathrooms} bath` : '';
  const floorStr = flat.floorNo !== null && flat.floorNo !== undefined ? `Floor ${flat.floorNo}` : '';
  const layoutParts = [sizeStr, bedStr, bathStr, floorStr].filter(Boolean);
  if (layoutParts.length > 0) {
    parts.push(layoutParts.join(' · '));
  }

  const priceStr = flat.grandTotalPrice ? formatBangladeshiCroreLakh(flat.grandTotalPrice) : (flat.askingPrice ? formatBangladeshiCroreLakh(flat.askingPrice) : '');
  const rateStr = flat.ratePerSqFt ? `৳${flat.ratePerSqFt.toLocaleString()}/sq ft` : '';
  const priceRate = [priceStr, rateStr ? `(${rateStr})` : ''].filter(Boolean).join(' ');
  const negStr = flat.negotiable ? 'Negotiable' : '';
  const priceParts = [priceRate, negStr].filter(Boolean);
  if (priceParts.length > 0) {
    parts.push(priceParts.join(' · '));
  }

  const statusStr = flat.listingStatus ? `Status: ${flat.listingStatus}` : '';
  const regStr = flat.registrationStatus ? `Paperwork: ${flat.registrationStatus}` : '';
  const mutStr = flat.mutationStatus && flat.mutationStatus !== 'Not Applicable' ? `Mutation: ${flat.mutationStatus}` : '';
  const docParts = [statusStr, regStr, mutStr].filter(Boolean);
  if (docParts.length > 0) {
    parts.push(docParts.join(', '));
  }

  return parts.join(' / ');
}

export const FlatDetailModal: React.FC<FlatDetailModalProps> = ({
  flat,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onContactStatusChange,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !flat) return null;

  const displayTitle = getFlatDisplayTitle(flat);
  const isUnderConstruction = flat.propertyType === 'Under-Construction Project';
  const missingFields = getMissingRequiredFields(flat);
  const isIncomplete = missingFields.length > 0;
  const shortId = flat.id ? `#PM-${flat.id.slice(-4).toUpperCase()}` : '#PM-PROP';

  const totalPrice = flat.grandTotalPrice || (flat.askingPrice && flat.flatSize ? flat.askingPrice : null);
  const priceHero = totalPrice ? formatBangladeshiCroreLakh(totalPrice) : 'Price upon request';

  const handleCopySummary = async () => {
    const summary = getSummaryText(flat);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      onShowToast('Summary copied to clipboard in WhatsApp format!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onShowToast('Failed to copy summary to clipboard.', 'error');
    }
  };

  const handleWhatsApp = () => {
    const summary = getSummaryText(flat);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (flat.phoneNumber) {
      window.location.href = `tel:${flat.phoneNumber}`;
    } else {
      onShowToast('No phone number available for this property.', 'error');
    }
  };

  return (
    <div 
      id="flat-detail-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in"
      onClick={onClose}
    >
      <div 
        id="flat-detail-drawer-container"
        className="bg-white w-full max-w-lg h-full max-h-screen flex flex-col shadow-2xl border-l border-gray-200 overflow-hidden font-sans transform transition-transform duration-300 ml-auto animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1B262C] text-white flex items-center justify-between border-b border-[#2C3E50]">
          <div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-mono text-amber-400 font-bold">{shortId}</span>
              <span>·</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadgeStyle(flat.listingStatus)}`}>
                {flat.listingStatus}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white truncate max-w-[320px]">
              {displayTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(flat);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Edit"
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Price Hero & Quick Selects Bar */}
        <div className="px-6 py-3.5 bg-[#FAF9F6] border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Asking / Total Price</div>
            <div className="text-xl font-black text-[#D35400] font-mono tracking-tight">
              {priceHero}
            </div>
            {flat.ratePerSqFt && (
              <div className="text-xs text-gray-600 font-mono">
                ৳{flat.ratePerSqFt.toLocaleString()} / sq ft {flat.negotiable && '• Negotiable'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div>
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Availability</span>
              <select
                value={flat.listingStatus}
                onChange={(e) => {
                  if (flat.id && onStatusChange) {
                    onStatusChange(flat.id, e.target.value as ListingStatus);
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D35400] cursor-pointer"
              >
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Rented">Rented</option>
                <option value="On Hold">On Hold</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Lead Stage</span>
              <select
                value={flat.contactStatus || 'Not Contacted Yet'}
                onChange={(e) => {
                  if (flat.id && onContactStatusChange) {
                    onContactStatusChange(flat.id, e.target.value as ContactStatus);
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D35400] cursor-pointer"
              >
                <option value="Not Contacted Yet">Not Contacted</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
                <option value="Visited">Visited</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={handleCall}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition cursor-pointer flex-shrink-0 min-h-[38px]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20ba5a] transition cursor-pointer flex-shrink-0 min-h-[38px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B262C] text-white font-semibold hover:bg-black transition cursor-pointer flex-shrink-0 min-h-[38px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copied!' : 'Copy summary'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDuplicate(flat);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition cursor-pointer flex-shrink-0 min-h-[38px]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D35400]" />
            <span>Duplicate</span>
          </button>
        </div>

        {/* Scrollable Body (Label-value pairs without boxes, hiding empty fields) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm text-gray-800">

          {/* Section: Overview & Location */}
          <div className="space-y-2.5 pb-4 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Property & Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {flat.projectName && (
                <div><span className="text-gray-400">Project:</span> <strong className="text-gray-900">{flat.projectName}</strong></div>
              )}
              {flat.area && (
                <div><span className="text-gray-400">Area:</span> <strong className="text-gray-900">{flat.area}</strong></div>
              )}
              {flat.location && (
                <div><span className="text-gray-400">Location:</span> <strong className="text-gray-900">{flat.location}</strong></div>
              )}
              {(flat.plotHouseNo || flat.buildingHouseNo) && (
                <div><span className="text-gray-400">Plot / House:</span> <strong className="text-gray-900">{flat.plotHouseNo || flat.buildingHouseNo}</strong></div>
              )}
              {flat.developerName && (
                <div><span className="text-gray-400">Developer:</span> <strong className="text-gray-900">{flat.developerName}</strong></div>
              )}
              {flat.handoverDate && (
                <div><span className="text-gray-400">Handover:</span> <strong className="text-gray-900">{flat.handoverDate}</strong></div>
              )}
            </div>
          </div>

          {/* Section: Size & Layout */}
          <div className="space-y-2.5 pb-4 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Size & Layout</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {flat.flatSize && (
                <div><span className="text-gray-400">Size:</span> <strong className="text-gray-900">{flat.flatSize.toLocaleString()} sq ft</strong></div>
              )}
              {flat.bedrooms !== null && flat.bedrooms !== undefined && (
                <div><span className="text-gray-400">Bedrooms:</span> <strong className="text-gray-900">{flat.bedrooms}</strong></div>
              )}
              {flat.bathrooms !== null && flat.bathrooms !== undefined && (
                <div><span className="text-gray-400">Bathrooms:</span> <strong className="text-gray-900">{flat.bathrooms}</strong></div>
              )}
              {flat.balconies !== null && flat.balconies !== undefined && (
                <div><span className="text-gray-400">Balconies:</span> <strong className="text-gray-900">{flat.balconies}</strong></div>
              )}
              {flat.floorNo !== null && flat.floorNo !== undefined && (
                <div><span className="text-gray-400">Floor:</span> <strong className="text-gray-900">{flat.floorNo} {flat.totalFloors ? `of ${flat.totalFloors}` : ''}</strong></div>
              )}
              {flat.flatPosition && (
                <div><span className="text-gray-400">Position:</span> <strong className="text-gray-900">{flat.flatPosition}</strong></div>
              )}
            </div>
            {flat.layoutDescription && (
              <div className="text-xs text-gray-600 mt-1">
                <span className="text-gray-400">Layout Notes:</span> {flat.layoutDescription}
              </div>
            )}
          </div>

          {/* Section: Financial Breakdown */}
          <div className="space-y-2.5 pb-4 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 font-mono">
              {flat.askingPrice && (
                <div><span className="text-gray-400 font-sans">Base Price:</span> <strong className="text-gray-900">৳{flat.askingPrice.toLocaleString()}</strong></div>
              )}
              {flat.utilityCharges && (
                <div><span className="text-gray-400 font-sans">Utility:</span> <strong className="text-gray-900">৳{flat.utilityCharges.toLocaleString()}</strong></div>
              )}
              {flat.parkingCharges && (
                <div><span className="text-gray-400 font-sans">Parking:</span> <strong className="text-gray-900">৳{flat.parkingCharges.toLocaleString()}</strong></div>
              )}
              {flat.otherCharges && (
                <div><span className="text-gray-400 font-sans">Other:</span> <strong className="text-gray-900">৳{flat.otherCharges.toLocaleString()}</strong></div>
              )}
              {flat.grandTotalPrice && (
                <div className="col-span-2"><span className="text-gray-400 font-sans">Grand Total:</span> <strong className="text-[#D35400] font-bold">৳{flat.grandTotalPrice.toLocaleString()}</strong></div>
              )}
            </div>
            {flat.paymentTerms && (
              <div className="text-xs text-gray-600">
                <span className="text-gray-400">Payment Terms:</span> {flat.paymentTerms}
              </div>
            )}
          </div>

          {/* Section: Contact & Reference */}
          <div className="space-y-2.5 pb-4 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact & Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {(flat.ownerName || flat.contactPerson) && (
                <div><span className="text-gray-400">Contact Person:</span> <strong className="text-gray-900">{flat.ownerName || flat.contactPerson}</strong></div>
              )}
              {flat.phoneNumber && (
                <div><span className="text-gray-400">Phone:</span> <strong className="text-gray-900 font-mono">{flat.phoneNumber}</strong></div>
              )}
              {flat.nextFollowUpDate && (
                <div><span className="text-gray-400">Next Follow-up:</span> <strong className="text-amber-700">{flat.nextFollowUpDate}</strong></div>
              )}
              {flat.collectedBy && (
                <div><span className="text-gray-400">Collected By:</span> <strong className="text-gray-900">{flat.collectedBy}</strong></div>
              )}
            </div>
          </div>

          {/* Section: Media & Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Media & Notes</h3>
            {flat.mediaLink && (
              <div>
                <a 
                  href={flat.mediaLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Photo / Video / Drive Link</span>
                </a>
              </div>
            )}
            {flat.additionalNotes && (
              <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block mb-1 font-semibold">Additional Notes:</span>
                {flat.additionalNotes}
              </div>
            )}
          </div>

        </div>

        {/* Footer Delete */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(flat);
            }}
            className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Property Entry</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
