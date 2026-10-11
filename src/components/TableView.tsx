import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  SlidersHorizontal, 
  Calendar,
  Home,
  HardHat
} from 'lucide-react';
import type { FlatRecord, ListingStatus, ContactStatus } from '../types.ts';
import { 
  getFlatDisplayTitle, 
  formatBangladeshiCroreLakh 
} from '../types.ts';
import { getStatusBadgeStyle } from './FlatCard.tsx';

interface TableViewProps {
  flats: FlatRecord[];
  onViewDetails: (flat: FlatRecord) => void;
  onEdit: (flat: FlatRecord) => void;
  onStatusChange?: (flatId: string, newStatus: ListingStatus) => void;
  onContactStatusChange?: (flatId: string, newContactStatus: ContactStatus) => void;
}

type SortField = 
  | 'id' 
  | 'projectName' 
  | 'area' 
  | 'propertyType' 
  | 'flatSize' 
  | 'bedrooms' 
  | 'ratePerSqFt' 
  | 'grandTotalPrice' 
  | 'listingStatus' 
  | 'contactStatus' 
  | 'nextFollowUpDate' 
  | 'updatedAt';

export const TableView: React.FC<TableViewProps> = ({
  flats,
  onViewDetails,
}) => {
  // Sort state: default sort overdue/today follow-ups first, then recently updated
  const [sortField, setSortField] = useState<SortField>('nextFollowUpDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column visibility state
  const [columnsVisible, setColumnsVisible] = useState<Record<string, boolean>>({
    id: true,
    name: true,
    area: true,
    type: true,
    size: true,
    beds: true,
    rate: true,
    total: true,
    availability: true,
    leadStage: true,
    followUp: true,
    reference: true,
    updated: true,
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFlats = useMemo(() => {
    return [...flats].sort((a, b) => {
      if (sortField === 'nextFollowUpDate') {
        const aDate = a.nextFollowUpDate || '9999-12-31';
        const bDate = b.nextFollowUpDate || '9999-12-31';
        if (aDate !== bDate) {
          return sortDirection === 'asc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
        }
      }

      let valA: any = a[sortField as keyof FlatRecord];
      let valB: any = b[sortField as keyof FlatRecord];

      if (sortField === 'projectName') {
        valA = getFlatDisplayTitle(a);
        valB = getFlatDisplayTitle(b);
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return sortDirection === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }, [flats, sortField, sortDirection]);

  const toggleColumn = (key: string) => {
    setColumnsVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col overflow-hidden font-sans">
      
      {/* Table Toolbar / Column Selector */}
      <div className="p-3 bg-[#FAF9F6] border-b border-gray-200 flex items-center justify-between gap-3 text-xs">
        <div className="text-gray-600 font-medium">
          Showing <strong>{sortedFlats.length}</strong> properties in Table view (Dense 40px rows)
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnMenu(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D35400]" />
            <span>Columns</span>
          </button>

          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Toggle Columns
              </div>
              {[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name / Project' },
                { key: 'area', label: 'Area' },
                { key: 'type', label: 'Type' },
                { key: 'size', label: 'Size (sq ft)' },
                { key: 'beds', label: 'Beds' },
                { key: 'rate', label: 'Rate/sq ft' },
                { key: 'total', label: 'Total Price' },
                { key: 'availability', label: 'Availability' },
                { key: 'leadStage', label: 'Lead Stage' },
                { key: 'followUp', label: 'Next Follow-up' },
                { key: 'reference', label: 'Reference' },
                { key: 'updated', label: 'Updated' },
              ].map(col => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:text-gray-900">
                  <input
                    type="checkbox"
                    checked={columnsVisible[col.key] !== false}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-gray-300 text-[#D35400] focus:ring-[#D35400]"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Container with Horizontal Scroll & Sticky Header */}
      <div className="overflow-x-auto max-h-[70vh] relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#1B262C] text-white sticky top-0 z-20 select-none">
            <tr>
              {columnsVisible.id !== false && (
                <th 
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.name !== false && (
                <th 
                  onClick={() => handleSort('projectName')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap sticky left-0 bg-[#1B262C] z-30 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Name / Building</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.area !== false && (
                <th 
                  onClick={() => handleSort('area')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Area</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.type !== false && (
                <th 
                  onClick={() => handleSort('propertyType')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Type</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.size !== false && (
                <th 
                  onClick={() => handleSort('flatSize')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.beds !== false && (
                <th 
                  onClick={() => handleSort('bedrooms')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Beds</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.rate !== false && (
                <th 
                  onClick={() => handleSort('ratePerSqFt')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Rate/sq ft</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.total !== false && (
                <th 
                  onClick={() => handleSort('grandTotalPrice')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Price</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.availability !== false && (
                <th 
                  onClick={() => handleSort('listingStatus')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Availability</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.leadStage !== false && (
                <th 
                  onClick={() => handleSort('contactStatus')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Lead Stage</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.followUp !== false && (
                <th 
                  onClick={() => handleSort('nextFollowUpDate')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Next Follow-up</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}

              {columnsVisible.reference !== false && (
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                  Reference
                </th>
              )}

              {columnsVisible.updated !== false && (
                <th 
                  onClick={() => handleSort('updatedAt')}
                  className="py-2.5 px-3 font-bold cursor-pointer hover:bg-black/20 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Updated</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedFlats.map((flat) => {
              const displayTitle = getFlatDisplayTitle(flat);
              const shortId = flat.id ? `#PM-${flat.id.slice(-4).toUpperCase()}` : '#PM';
              const isUnderConstruction = flat.propertyType === 'Under-Construction Project';
              
              const totalPrice = flat.grandTotalPrice || (flat.askingPrice && flat.flatSize ? flat.askingPrice : null);

              return (
                <tr 
                  key={flat.id}
                  onClick={() => onViewDetails(flat)}
                  className="hover:bg-[#FAF9F6] transition cursor-pointer h-[40px] text-gray-800"
                >
                  {columnsVisible.id !== false && (
                    <td className="py-2 px-3 font-mono text-[11px] text-[#D35400] font-bold whitespace-nowrap">
                      {shortId}
                    </td>
                  )}

                  {columnsVisible.name !== false && (
                    <td className="py-2 px-3 font-semibold text-[#1B262C] whitespace-nowrap sticky left-0 bg-white group-hover:bg-[#FAF9F6] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                        {isUnderConstruction ? (
                          <HardHat className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <Home className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{displayTitle}</span>
                      </div>
                    </td>
                  )}

                  {columnsVisible.area !== false && (
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {flat.area || flat.location || '—'}
                    </td>
                  )}

                  {columnsVisible.type !== false && (
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap text-[11px]">
                      {isUnderConstruction ? 'Project' : 'Ready'}
                    </td>
                  )}

                  {columnsVisible.size !== false && (
                    <td className="py-2 px-3 text-right font-mono text-gray-800 whitespace-nowrap tabular-nums">
                      {flat.flatSize ? `${flat.flatSize.toLocaleString()} sq ft` : '—'}
                    </td>
                  )}

                  {columnsVisible.beds !== false && (
                    <td className="py-2 px-3 text-center font-mono text-gray-800 whitespace-nowrap tabular-nums">
                      {flat.bedrooms ?? '—'}
                    </td>
                  )}

                  {columnsVisible.rate !== false && (
                    <td className="py-2 px-3 text-right font-mono text-gray-800 whitespace-nowrap tabular-nums">
                      {flat.ratePerSqFt ? `৳${flat.ratePerSqFt.toLocaleString()}` : '—'}
                    </td>
                  )}

                  {columnsVisible.total !== false && (
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#D35400] whitespace-nowrap tabular-nums">
                      {totalPrice ? formatBangladeshiCroreLakh(totalPrice) : '—'}
                    </td>
                  )}

                  {columnsVisible.availability !== false && (
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeStyle(flat.listingStatus)}`}>
                        {flat.listingStatus}
                      </span>
                    </td>
                  )}

                  {columnsVisible.leadStage !== false && (
                    <td className="py-2 px-3 text-gray-700 whitespace-nowrap text-[11px]">
                      {flat.contactStatus || 'Not Contacted Yet'}
                    </td>
                  )}

                  {columnsVisible.followUp !== false && (
                    <td className="py-2 px-3 whitespace-nowrap text-[11px]">
                      {flat.nextFollowUpDate ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                          flat.nextFollowUpDate < new Date().toISOString().split('T')[0]
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {flat.nextFollowUpDate}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )}

                  {columnsVisible.reference !== false && (
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap text-[11px]">
                      {flat.collectedBy || flat.createdBy || 'Team'}
                    </td>
                  )}

                  {columnsVisible.updated !== false && (
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap text-[11px] font-mono">
                      {flat.updatedAt ? flat.updatedAt.split('T')[0] : (flat.createdAt ? flat.createdAt.split('T')[0] : '—')}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
