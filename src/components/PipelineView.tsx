import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Calendar, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  ArrowRight
} from 'lucide-react';
import type { FlatRecord, ContactStatus } from '../types.ts';
import { getFlatDisplayTitle, formatBangladeshiCroreLakh } from '../types.ts';

interface PipelineViewProps {
  flats: FlatRecord[];
  onViewDetails: (flat: FlatRecord) => void;
  onEdit: (flat: FlatRecord) => void;
  onDelete: (flat: FlatRecord) => void;
  onContactStatusChange: (flatId: string, newStatus: ContactStatus, previousStatus?: ContactStatus) => void;
}

const STAGES: ContactStatus[] = [
  'Not Contacted Yet',
  'Contacted',
  'Follow-up Needed',
  'Visited',
  'Negotiating',
  'Closed'
];

const STAGE_NEXT: Record<ContactStatus, ContactStatus | null> = {
  'Not Contacted Yet': 'Contacted',
  'Contacted': 'Follow-up Needed',
  'Follow-up Needed': 'Visited',
  'Visited': 'Negotiating',
  'Negotiating': 'Closed',
  'Closed': null
};

const STAGE_COLORS: Record<ContactStatus, string> = {
  'Not Contacted Yet': '#6B7280',
  'Contacted': '#3B82F6',
  'Follow-up Needed': '#D97706',
  'Visited': '#8B5CF6',
  'Negotiating': '#EC4899',
  'Closed': '#10B981',
};

export const PipelineView: React.FC<PipelineViewProps> = ({
  flats,
  onViewDetails,
  onEdit,
  onDelete,
  onContactStatusChange,
}) => {
  // Mobile accordion open states: default first stage with entries open
  const [openAccordionStages, setOpenAccordionStages] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    let firstFound = false;
    STAGES.forEach((stage) => {
      const count = flats.filter((f) => (f.contactStatus || 'Not Contacted Yet') === stage).length;
      if (count > 0 && !firstFound) {
        initial[stage] = true;
        firstFound = true;
      } else {
        initial[stage] = false;
      }
    });
    if (!firstFound && STAGES.length > 0) {
      initial[STAGES[0]] = true;
    }
    return initial;
  });

  const allExpanded = STAGES.every((s) => openAccordionStages[s]);

  const toggleAllAccordions = () => {
    const newState: Record<string, boolean> = {};
    STAGES.forEach((s) => {
      newState[s] = !allExpanded;
    });
    setOpenAccordionStages(newState);
  };

  const toggleAccordion = (stage: string) => {
    setOpenAccordionStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const [showMoreCounts, setShowMoreCounts] = useState<Record<string, number>>({});

  const handleShowMore = (stage: string) => {
    setShowMoreCounts((prev) => ({ ...prev, [stage]: (prev[stage] || 8) + 8 }));
  };

  const [activeMenuFlatId, setActiveMenuFlatId] = useState<string | null>(null);
  const [mobileMoveFlat, setMobileMoveFlat] = useState<FlatRecord | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuFlatId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 w-full max-w-full overflow-x-hidden font-sans">
      
      {/* Mobile Expand/Collapse All Toolbar (<640px) */}
      <div className="md:hidden flex items-center justify-between px-1 text-xs text-[var(--ink-2)] font-semibold mb-1">
        <span>Stages ({flats.length} total)</span>
        <button
          type="button"
          onClick={toggleAllAccordions}
          className="text-[var(--clay)] hover:underline cursor-pointer py-1 px-2"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* 
        Responsive Container:
        - Phone (<640px): stacked accordions (display: block, gap: 8px)
        - Tablet (640-1199px): 3 columns x 2 rows (grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;)
        - Desktop (≥1200px): 6 columns side-by-side (grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;)
      */}
      <div className="block md:grid md:grid-cols-3 xl:grid-cols-6 gap-3 w-full min-w-0">
        {STAGES.map((stage) => {
          const stageFlats = flats
            .filter((f) => (f.contactStatus || 'Not Contacted Yet') === stage)
            .sort((a, b) => {
              const aDate = a.nextFollowUpDate || '9999-12-31';
              const bDate = b.nextFollowUpDate || '9999-12-31';
              if (aDate !== bDate) return aDate.localeCompare(bDate);
              const aUp = a.updatedAt || a.createdAt || '';
              const bUp = b.updatedAt || b.createdAt || '';
              return bUp.localeCompare(aUp);
            });

          const isAccordionOpen = openAccordionStages[stage] !== false;
          const limit = showMoreCounts[stage] || 8;
          const displayedFlats = stageFlats.slice(0, limit);
          const hasMore = stageFlats.length > limit;

          return (
            <div 
              key={stage} 
              className="min-w-0 relative flex flex-col mb-2 md:mb-0 overflow-visible"
            >
              {/* Column / Accordion Header */}
              <div 
                onClick={() => {
                  if (window.innerWidth < 640) {
                    toggleAccordion(stage);
                  }
                }}
                style={{
                  backgroundColor: isAccordionOpen && window.innerWidth < 640 ? 'var(--paper)' : 'var(--surface)',
                  borderColor: 'var(--rule)',
                }}
                className={`h-[52px] px-3 border rounded-lg flex items-center justify-between gap-2 select-none cursor-pointer md:cursor-default relative ${
                  isAccordionOpen ? 'sticky top-0 z-20 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="md:hidden text-[var(--ink-3)]">
                    {isAccordionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>

                  {/* 8px colored dot before name */}
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: STAGE_COLORS[stage] }} 
                  />

                  <span className="font-semibold text-[15px] text-[var(--ink)] truncate">
                    {stage}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--ink-2)]">
                    {stageFlats.length}
                  </span>
                  <span className="md:hidden text-[var(--ink-3)]">
                    {isAccordionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </div>
              </div>

              {/* Cards Container (Accordion body on mobile, always visible on tablet/desktop) */}
              <div className={`p-2 space-y-2 min-w-0 ${isAccordionOpen ? 'block' : 'hidden md:block'} flex-1`}>
                {stageFlats.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--ink-3)] italic border border-dashed border-[var(--rule)] rounded-lg bg-[var(--surface)] my-1">
                    No entries
                  </div>
                ) : (
                  <>
                    {displayedFlats.map((flat) => {
                      const displayTitle = getFlatDisplayTitle(flat);
                      const totalPrice = flat.grandTotalPrice || (flat.askingPrice && flat.flatSize ? flat.askingPrice : null);
                      const shortId = flat.id ? `#PM-${flat.id.slice(-4).toUpperCase()}` : '#PM';
                      const nextStage = STAGE_NEXT[stage];

                      let followUpBadge = null;
                      if (flat.nextFollowUpDate) {
                        const todayStr = new Date().toISOString().split('T')[0];
                        if (flat.nextFollowUpDate === todayStr) {
                          followUpBadge = <span className="text-[11px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-medium">Follow up today</span>;
                        } else if (flat.nextFollowUpDate < todayStr) {
                          followUpBadge = <span className="text-[11px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded font-medium">Overdue</span>;
                        }
                      }

                      return (
                        <div
                          key={flat.id}
                          onClick={() => onViewDetails(flat)}
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--rule)',
                          }}
                          className="rounded-lg border p-3 hover:border-gray-400 transition cursor-pointer space-y-2 min-w-0 overflow-visible relative group font-sans"
                        >
                          {/* Row 1: Name (16px, weight 600, --ink) & ⋯ Button */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="font-semibold text-[16px] text-[var(--ink)] truncate leading-tight">
                              {displayTitle || 'Untitled entry'}
                            </div>

                            <div className="relative flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.innerWidth < 640) {
                                    setMobileMoveFlat(flat);
                                  } else {
                                    setActiveMenuFlatId(activeMenuFlatId === flat.id ? null : (flat.id || null));
                                  }
                                }}
                                className="w-[44px] h-[44px] -my-2 -mr-2 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition rounded-lg cursor-pointer"
                                title="Options"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>

                              {/* Desktop Popover Menu */}
                              {activeMenuFlatId === flat.id && window.innerWidth >= 640 && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 text-xs"
                                >
                                  <div className="px-3 py-1 font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                                    Move to stage
                                  </div>
                                  {STAGES.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuFlatId(null);
                                        if (flat.id && s !== stage) {
                                          onContactStatusChange(flat.id, s, stage);
                                        }
                                      }}
                                      className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between ${
                                        s === stage ? 'font-bold text-[var(--pine)]' : 'text-gray-700'
                                      }`}
                                    >
                                      <span>{s}</span>
                                      {s === stage && <Check className="w-3.5 h-3.5 text-[var(--pine)]" />}
                                    </button>
                                  ))}
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuFlatId(null);
                                      onEdit(flat);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Property</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuFlatId(null);
                                      onDelete(flat);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Price (18px, weight 700, --ink) & Size/Beds (13px, --ink-2) */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            {totalPrice ? (
                              <span className="font-bold text-[18px] text-[var(--ink)] tabular-nums truncate">
                                {formatBangladeshiCroreLakh(totalPrice)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded border border-dashed border-[var(--rule)] text-[var(--ink-3)] text-[11px]">
                                + Add price
                              </span>
                            )}

                            <span className="text-[13px] text-[var(--ink-2)] truncate tabular-nums">
                              {[
                                flat.flatSize ? `${flat.flatSize.toLocaleString()} sq ft` : null,
                                flat.bedrooms ? `${flat.bedrooms} bed` : null
                              ].filter(Boolean).join(' · ')}
                            </span>
                          </div>

                          {/* Row 3: ID (12px, --ink-3), Follow-up badge & Stage Advance Button */}
                          <div className="flex items-center justify-between gap-2 pt-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12px] text-[var(--ink-3)] flex-shrink-0">
                                {shortId}
                              </span>
                              {followUpBadge}
                            </div>

                            <div className="flex-shrink-0">
                              {stage === 'Closed' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (flat.id) {
                                      onContactStatusChange(flat.id, 'Negotiating', stage);
                                    }
                                  }}
                                  style={{
                                    backgroundColor: 'var(--pine-tint)',
                                    color: 'var(--pine)',
                                  }}
                                  className="relative h-[36px] px-3 rounded-md font-semibold text-[13px] flex items-center justify-center transition cursor-pointer after:absolute after:inset-[-4px]"
                                >
                                  Reopen
                                </button>
                              ) : nextStage ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (flat.id) {
                                      onContactStatusChange(flat.id, nextStage, stage);
                                    }
                                  }}
                                  style={{
                                    backgroundColor: 'var(--pine-tint)',
                                    color: 'var(--pine)',
                                  }}
                                  className="relative h-[36px] px-3 rounded-md font-semibold text-[13px] flex items-center justify-center gap-1 transition cursor-pointer after:absolute after:inset-[-4px]"
                                >
                                  <span>{nextStage}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => handleShowMore(stage)}
                        className="w-full py-2 rounded-lg bg-[var(--surface)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] transition cursor-pointer min-h-[38px]"
                      >
                        Show {stageFlats.length - limit} more
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Bottom Sheet for "Move to..." (<640px) */}
      {mobileMoveFlat && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in"
          onClick={() => setMobileMoveFlat(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full rounded-t-3xl p-5 space-y-3 shadow-2xl animate-in slide-in-from-bottom font-sans"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-base text-[var(--ink)]">Move to</h3>
              <button
                type="button"
                onClick={() => setMobileMoveFlat(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 py-2">
              {STAGES.map((s) => {
                const isCurrent = (mobileMoveFlat.contactStatus || 'Not Contacted Yet') === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const prev = mobileMoveFlat.contactStatus || 'Not Contacted Yet';
                      const flatId = mobileMoveFlat.id;
                      setMobileMoveFlat(null);
                      if (flatId && s !== prev) {
                        onContactStatusChange(flatId, s, prev);
                      }
                    }}
                    className={`w-full h-[56px] px-4 rounded-xl flex items-center justify-between text-sm font-semibold transition cursor-pointer ${
                      isCurrent 
                        ? 'bg-[var(--ink)] text-white shadow-sm' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span>{s}</span>
                    {isCurrent && <Check className="w-5 h-5 text-amber-400" />}
                  </button>
                );
              })}

              <div className="border-t border-gray-200 pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = mobileMoveFlat;
                    setMobileMoveFlat(null);
                    onEdit(target);
                  }}
                  className="flex-1 h-[48px] rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Property</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = mobileMoveFlat;
                    setMobileMoveFlat(null);
                    onDelete(target);
                  }}
                  className="flex-1 h-[48px] rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMoveFlat(null)}
              className="w-full h-[52px] rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
