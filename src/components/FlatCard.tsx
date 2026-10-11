import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  User, 
  Maximize2, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar,
  ExternalLink,
  AlertTriangle,
  HardHat,
  Home,
  Calculator,
  Compass,
  Layers,
  Clock
} from 'lucide-react';
import type { FlatRecord, ListingStatus } from '../types.ts';
import { 
  getFlatDisplayTitle, 
  getMissingRequiredFields, 
  isFlatIncomplete,
  formatBangladeshiCurrency,
  formatBangladeshiCroreLakh,
  resolveFacingDirections
} from '../types.ts';

interface FlatCardProps {
  flat: FlatRecord;
  onViewDetails: (flat: FlatRecord) => void;
  onEdit: (flat: FlatRecord) => void;
  onDelete: (flat: FlatRecord) => void;
}

export const getStatusBadgeStyle = (status: ListingStatus) => {
  switch (status) {
    case 'Available':
      return 'bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB] font-bold text-[10px] tracking-wider uppercase';
    case 'On Hold':
      return 'bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] tracking-wider uppercase';
    case 'Not Interested':
      return 'bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px] tracking-wider uppercase';
    case 'Sold':
      return 'bg-gray-100 text-gray-700 border border-gray-200 font-bold text-[10px] tracking-wider uppercase';
    case 'Rented':
      return 'bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[10px] tracking-wider uppercase';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200 font-bold text-[10px] tracking-wider uppercase';
  }
};

export const FlatCard: React.FC<FlatCardProps> = ({
  flat,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [showIncompletePopover, setShowIncompletePopover] = useState(false);

  const displayTitle = getFlatDisplayTitle(flat);
  const isUnderConstruction = flat.propertyType === 'Under-Construction Project';
  const missingFields = getMissingRequiredFields(flat);
  const isIncomplete = missingFields.length > 0;

  const shortId = flat.id ? `#PM-${flat.id.slice(-4).toUpperCase()}` : '#PM-PROP';

  // Subtitle fallback logic
  const renderSubtitle = () => {
    // If title was location, show Project Name or Building No. if present
    if (flat.location && displayTitle === flat.location.trim()) {
      if (flat.projectName) {
        return `Project: ${flat.projectName}`;
      }
      if (flat.plotHouseNo || flat.buildingHouseNo) {
        return `Plot/House: ${flat.plotHouseNo || flat.buildingHouseNo}`;
      }
    }
    // If title was project name, show Location if present
    if (flat.projectName && displayTitle === flat.projectName.trim()) {
      if (flat.location) {
        return `Location: ${flat.location}`;
      }
      if (flat.developerName) {
        return `Developer: ${flat.developerName}`;
      }
    }
    // If title was contact or phone, show location if present
    if (flat.location && displayTitle !== flat.location.trim()) {
      return `Location: ${flat.location}`;
    }
    return null;
  };

  const subtitle = renderSubtitle();

  // Contact name & role fallback
  const contactName = isUnderConstruction
    ? (flat.contactPerson || flat.developerName || flat.ownerName || null)
    : (flat.ownerName || null);

  const contactRole = isUnderConstruction
    ? (flat.developerName ? `Dev: ${flat.developerName}` : 'Developer Contact')
    : 'Owner';

  // Safe numerical calculations for Estimated Total Price
  const hasRate = flat.ratePerSqFt !== null && flat.ratePerSqFt !== undefined && Number(flat.ratePerSqFt) > 0;
  const hasSize = flat.flatSize !== null && flat.flatSize !== undefined && Number(flat.flatSize) > 0;
  const hasEstimatedTotal = hasRate && hasSize;
  const estimatedTotal = hasEstimatedTotal ? Number(flat.flatSize) * Number(flat.ratePerSqFt) : null;

  // Facing directions
  const facingList = resolveFacingDirections(flat);

  return (
    <div 
      id={`flat-card-${flat.id}`}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between overflow-visible group relative"
    >
      {/* Top Header: ID, Property Type, Incomplete Badge & Status */}
      <div className="p-5 pb-4">
        
        {/* Identifier, Badges & Status */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#D35400] font-bold tracking-tight">
              {shortId}
            </span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              {isUnderConstruction ? (
                <>
                  <HardHat className="w-3 h-3 text-amber-600" />
                  <span>Under-Construction</span>
                </>
              ) : (
                <>
                  <Home className="w-3 h-3 text-gray-500" />
                  <span>Ready Flat</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Incomplete Badge with Interactive Popover */}
            {isIncomplete && (
              <div className="relative inline-block">
                <button
                  type="button"
                  id={`incomplete-badge-${flat.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIncompletePopover(!showIncompletePopover);
                  }}
                  onMouseEnter={() => setShowIncompletePopover(true)}
                  onMouseLeave={() => setShowIncompletePopover(false)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Missing key data. Click to see details."
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  <span>Incomplete</span>
                </button>

                {/* Popover */}
                {showIncompletePopover && (
                  <div 
                    className="absolute right-0 top-full mt-1.5 z-40 w-60 p-3 bg-white rounded-xl shadow-xl border border-amber-200 text-left animate-in fade-in zoom-in-95"
                    onMouseEnter={() => setShowIncompletePopover(true)}
                    onMouseLeave={() => setShowIncompletePopover(false)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center justify-between border-b border-gray-100 pb-1">
                      <span>Missing Information:</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">
                        {missingFields.length} missing
                      </span>
                    </div>
                    <ul className="space-y-1 mb-2.5 text-xs text-gray-700">
                      {missingFields.map((fld) => (
                        <li key={fld} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          <span>{fld}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      id={`btn-popover-edit-${flat.id}`}
                      onClick={() => {
                        setShowIncompletePopover(false);
                        onEdit(flat);
                      }}
                      className="w-full py-1.5 px-2.5 bg-[#1B262C] hover:bg-[#2C3E50] text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#D35400]" />
                      <span>Edit Entry Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${getStatusBadgeStyle(
                flat.listingStatus
              )}`}
            >
              {flat.listingStatus}
            </span>
          </div>
        </div>

        {/* Title Header */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#D35400] mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
              {displayTitle}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Key Metrics Box with Bangladeshi Digit Grouping */}
        <div className="my-3 p-3 rounded-xl bg-[#FDFCFB] border border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {/* Left metric: Asking Price or Rate */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block">
                {isUnderConstruction ? 'Rate / sq ft' : 'Asking Price'}
              </span>
              <span className="text-sm sm:text-base font-black text-gray-900 truncate block font-mono">
                {isUnderConstruction ? (
                  flat.ratePerSqFt ? `৳${formatBangladeshiCurrency(flat.ratePerSqFt)}` : 'Rate on Request'
                ) : (
                  flat.askingPrice ? `৳${formatBangladeshiCurrency(flat.askingPrice)}` : 'Price on Request'
                )}
              </span>
              {/* Bangladeshi Crore/Lakh Helper */}
              {!isUnderConstruction && flat.askingPrice && (
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  {formatBangladeshiCroreLakh(flat.askingPrice)}
                </span>
              )}
              {flat.negotiable && (
                <span className="text-[10px] text-[#D35400] font-semibold block">
                  (Negotiable)
                </span>
              )}
            </div>

            {/* Right metric: Flat Size */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block">
                Flat Size
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-900 block font-mono">
                {flat.flatSize ? `${formatBangladeshiCurrency(flat.flatSize)} sq ft` : 'Size on Request'}
              </span>
              {/* Ready Flat Beds / Baths if present */}
              {!isUnderConstruction && (flat.bedrooms || flat.bathrooms) ? (
                <span className="text-[11px] text-gray-500 block truncate">
                  {flat.bedrooms ? `${flat.bedrooms} Bed` : ''}
                  {flat.bedrooms && flat.bathrooms ? ' • ' : ''}
                  {flat.bathrooms ? `${flat.bathrooms} Bath` : ''}
                </span>
              ) : null}
              {/* Under-Construction Handover Date if present */}
              {isUnderConstruction && flat.handoverDate ? (
                <span className="text-[11px] text-amber-800 font-medium block truncate">
                  Handover: {flat.handoverDate}
                </span>
              ) : null}
            </div>
          </div>

          {/* Null-safe Estimated Total Price: Only rendered when BOTH Flat Size and Rate per sq ft exist */}
          {hasEstimatedTotal && estimatedTotal !== null && (
            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-[#D35400]" />
                <span>Estimated Total</span>
              </span>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-black text-[#D35400] font-mono">
                  ৳{formatBangladeshiCurrency(estimatedTotal)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold ml-1.5">
                  ({formatBangladeshiCroreLakh(estimatedTotal)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feature Tags (Facing, Floor, Status) */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
          {facingList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
              <Compass className="w-3 h-3 text-gray-500" />
              <span>{facingList.join(', ')}</span>
            </span>
          )}
          {flat.floorNo !== null && flat.floorNo !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
              <Layers className="w-3 h-3 text-gray-500" />
              <span>Floor {flat.floorNo}{flat.totalFloors ? ` of ${flat.totalFloors}` : ''}</span>
            </span>
          )}
          {flat.contactStatus && flat.contactStatus !== 'Not Contacted Yet' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{flat.contactStatus}</span>
            </span>
          )}
        </div>

        {/* Contact info rows (omitted if completely empty) */}
        <div className="space-y-2 text-sm text-gray-600">
          
          {contactName && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-800 truncate text-xs sm:text-sm">
                  {contactName}
                  {contactRole && (
                    <span className="text-gray-400 text-[11px] font-normal ml-1">
                      ({contactRole})
                    </span>
                  )}
                </span>
              </div>

              {flat.dateContacted && (
                <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0" title="Date Contacted">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{flat.dateContacted}</span>
                </div>
              )}
            </div>
          )}

          {flat.phoneNumber ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
                <Phone className="w-3.5 h-3.5 text-[#D35400] flex-shrink-0" />
                <span className="tracking-wide font-mono text-xs">{flat.phoneNumber}</span>
              </div>

              {/* Quick Call Button */}
              <a
                href={`tel:${flat.phoneNumber.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E0F2F1] text-[#00695C] hover:bg-[#B2DFDB] font-bold text-xs transition border border-[#80CBC4]/60 min-h-[36px]"
                title={`Call ${flat.phoneNumber}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          ) : null}

        </div>

      </div>

      {/* Footer Details: Collector/Created By & Action buttons */}
      <div className="px-5 py-3 bg-[#FAF8F5] border-t border-gray-100 text-xs">
        
        {/* Attribution & Media Link */}
        <div className="flex items-center justify-between text-gray-500 mb-2.5">
          <span className="truncate text-[11px]">
            By: <strong className="text-gray-800 font-semibold">{flat.createdBy || flat.collectedBy || 'Team Member'}</strong>
          </span>
          {flat.mediaLink && (
            <a
              href={flat.mediaLink.startsWith('http') ? flat.mediaLink : `https://${flat.mediaLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#D35400] hover:underline font-semibold ml-2 flex-shrink-0 text-[11px]"
              title="Open Media / Link"
            >
              <span>Media Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Action Buttons: Details, Edit, Delete */}
        <div className="grid grid-cols-3 gap-2">
          
          <button
            id={`btn-view-details-${flat.id}`}
            type="button"
            onClick={() => onViewDetails(flat)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:text-[#D35400] hover:border-[#D35400] transition-colors min-h-[40px] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
            <span>Details</span>
          </button>

          <button
            id={`btn-edit-flat-${flat.id}`}
            type="button"
            onClick={() => onEdit(flat)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:text-[#D35400] hover:border-[#D35400] transition-colors min-h-[40px] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#D35400]" />
            <span>Edit</span>
          </button>

          <button
            id={`btn-delete-flat-${flat.id}`}
            type="button"
            onClick={() => onDelete(flat)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-300 transition-colors min-h-[40px] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete</span>
          </button>

        </div>

      </div>

    </div>
  );
};
