import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Tag, 
  KeyRound, 
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import type { FlatRecord, CompletenessFilter } from '../types.ts';
import { isFlatIncomplete } from '../types.ts';

interface KPIDashboardProps {
  flats: FlatRecord[];
  currentStatus: string;
  completenessFilter: CompletenessFilter;
  onSelectStatus: (status: string) => void;
  onSelectCompleteness: (completeness: CompletenessFilter) => void;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  flats,
  currentStatus,
  completenessFilter,
  onSelectStatus,
  onSelectCompleteness,
}) => {
  // Always calculated from the full dataset (real-time from Firestore onSnapshot)
  const totalCount = flats.length;
  const availableCount = flats.filter((f) => f.listingStatus === 'Available').length;
  const soldCount = flats.filter((f) => f.listingStatus === 'Sold').length;
  const rentedCount = flats.filter((f) => f.listingStatus === 'Rented').length;
  const onHoldCount = flats.filter((f) => f.listingStatus === 'On Hold').length;
  const incompleteCount = flats.filter(isFlatIncomplete).length;

  const kpiItems = [
    {
      id: 'All',
      label: 'Total Properties',
      count: totalCount,
      icon: Building2,
      activeBg: 'bg-[#1B262C] text-white border-[#1B262C] shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-[#1B262C] border-gray-200 hover:border-gray-300 hover:bg-white',
      badgeBg: 'bg-gray-100 text-gray-700',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: false,
    },
    {
      id: 'Available',
      label: 'Available',
      count: availableCount,
      icon: CheckCircle2,
      activeBg: 'bg-emerald-700 text-white border-emerald-700 shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-[#1B262C] border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: false,
    },
    {
      id: 'Sold',
      label: 'Booked / Sold',
      count: soldCount,
      icon: Tag,
      activeBg: 'bg-purple-700 text-white border-purple-700 shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-[#1B262C] border-gray-200 hover:border-purple-200 hover:bg-purple-50/30',
      badgeBg: 'bg-purple-50 text-purple-700',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: false,
    },
    {
      id: 'Rented',
      label: 'Rented',
      count: rentedCount,
      icon: KeyRound,
      activeBg: 'bg-blue-700 text-white border-blue-700 shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-[#1B262C] border-gray-200 hover:border-blue-200 hover:bg-blue-50/30',
      badgeBg: 'bg-blue-50 text-blue-700',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: false,
    },
    {
      id: 'On Hold',
      label: 'On Hold',
      count: onHoldCount,
      icon: Clock,
      activeBg: 'bg-amber-700 text-white border-amber-700 shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-[#1B262C] border-gray-200 hover:border-amber-200 hover:bg-amber-50/30',
      badgeBg: 'bg-amber-50 text-amber-700',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: false,
    },
    {
      id: 'Incomplete',
      label: 'Incomplete Entries',
      count: incompleteCount,
      icon: AlertTriangle,
      activeBg: 'bg-amber-600 text-white border-amber-600 shadow-sm',
      inactiveBg: 'bg-[#FAF9F6] text-amber-900 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50',
      badgeBg: 'bg-amber-100 text-amber-800',
      activeBadgeBg: 'bg-white/20 text-white',
      isCompleteness: true,
    },
  ];

  const handleCardClick = (item: typeof kpiItems[0]) => {
    if (item.isCompleteness) {
      if (completenessFilter === 'incomplete') {
        onSelectCompleteness('all');
      } else {
        onSelectCompleteness('incomplete');
      }
    } else {
      if (currentStatus === item.id && item.id !== 'All') {
        onSelectStatus('All');
      } else {
        onSelectStatus(item.id);
      }
    }
  };

  return (
    <div id="kpi-dashboard" className="w-full mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D35400]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
            Real-Time Workspace Overview
          </span>
        </div>
        <span className="text-[11px] text-gray-700 font-medium hidden sm:inline-block">
          Click any metric card to filter list
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {kpiItems.map((item) => {
          const isActive = item.isCompleteness 
            ? completenessFilter === 'incomplete'
            : currentStatus === item.id && completenessFilter !== 'incomplete';
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`kpi-card-${item.id.toLowerCase().replace(/[\s/]+/g, '-')}`}
              type="button"
              onClick={() => handleCardClick(item)}
              className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isActive ? item.activeBg : item.inactiveBg
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`text-[11px] font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : (item.isCompleteness ? 'text-amber-600' : 'text-gray-400')}`} />
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black tracking-tight">
                  {item.count}
                </span>
                {isActive && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${item.activeBadgeBg}`}>
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
