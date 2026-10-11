import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Layers,
  PhoneCall,
  MapPin,
  Sparkles
} from 'lucide-react';
import type { FlatRecord, ListingStatus, ViewMode, CompletenessFilter } from './types.ts';
import { isFlatIncomplete } from './types.ts';
import { 
  auth, 
  onAuthStateChanged, 
  logOut, 
  subscribeToFlats, 
  addFlatRecord, 
  updateFlatRecord, 
  deleteFlatRecord, 
  fixOldEntries,
  ADMIN_EMAILS,
  type User 
} from './firebase.ts';
import { exportFlatsToCSV } from './services/googleSheets.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { FlatCard } from './components/FlatCard.tsx';
import { FlatForm } from './components/FlatForm.tsx';
import { FlatDetailModal } from './components/FlatDetailModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { BackupModal } from './components/BackupModal.tsx';
import { ImportSheetModal } from './components/ImportSheetModal.tsx';
import { KPIDashboard } from './components/KPIDashboard.tsx';
import { TableView } from './components/TableView.tsx';
import { PipelineView } from './components/PipelineView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Flats data
  const [flats, setFlats] = useState<FlatRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingFlat, setEditingFlat] = useState<FlatRecord | null>(null);
  const [detailFlat, setDetailFlat] = useState<FlatRecord | null>(null);
  const [deletingFlat, setDeletingFlat] = useState<FlatRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeListMode, setActiveListMode] = useState<'cards' | 'table' | 'pipeline'>(() => {
    try {
      const saved = localStorage.getItem('propmarty_view_mode');
      if (saved === 'cards' || saved === 'table' || saved === 'pipeline') return saved;
    } catch {}
    return window.innerWidth >= 1024 ? 'table' : 'cards';
  });

  const [groupBy, setGroupBy] = useState<'none' | 'area' | 'status'>('none');

  useEffect(() => {
    try {
      localStorage.setItem('propmarty_view_mode', activeListMode);
    } catch {}
  }, [activeListMode]);

  const handleStatusChange = async (flatId: string, newStatus: ListingStatus) => {
    try {
      await updateFlatRecord(flatId, { listingStatus: newStatus, updatedAt: new Date().toISOString() });
      showToast(`Updated status to ${newStatus}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleContactStatusChange = async (flatId: string, newStatus: ContactStatus, previousStatus?: ContactStatus) => {
    try {
      await updateFlatRecord(flatId, { contactStatus: newStatus, updatedAt: new Date().toISOString() });
      if (previousStatus) {
        showToast(`Moved to ${newStatus}`, 'success', async () => {
          try {
            await updateFlatRecord(flatId, { contactStatus: previousStatus, updatedAt: new Date().toISOString() });
            showToast(`Reverted to ${previousStatus}`);
          } catch (e: any) {
            showToast(e.message || 'Failed to revert', 'error');
          }
        });
      } else {
        showToast(`Updated lead stage to ${newStatus}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead stage', 'error');
    }
  };

  const handleDuplicateFlat = (flat: FlatRecord) => {
    const duplicated: FlatRecord = {
      ...flat,
      id: undefined,
      activities: undefined,
      dateContacted: '',
      nextFollowUpDate: '',
      createdAt: undefined,
      createdBy: undefined,
      updatedAt: undefined,
      updatedBy: undefined,
    };
    setEditingFlat(duplicated);
    setViewMode('add');
    setDetailFlat(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>('all');

  // Modals
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string; onUndo?: () => void } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
    setToastMessage({ text, type, onUndo });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Auth subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [showAllFlats, setShowAllFlats] = useState(false);
  const ADMIN_EMAIL = 'abdullahakash940@gmail.com';
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // Firestore real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    setDataLoading(true);
    setDataError(null);

    const unsubscribe = subscribeToFlats(
      (items) => {
        setFlats(items);
        setDataLoading(false);
        setDataError(null);
      },
      (err) => {
        console.error('Data subscription error:', err);
        setDataError('Unable to connect to shared database. Please check your internet connection.');
        setDataLoading(false);
      },
      showAllFlats
    );

    return () => unsubscribe();
  }, [currentUser, showAllFlats]);

  // Filtered Flats
  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      // Status filter
      if (statusFilter !== 'All' && flat.listingStatus !== statusFilter) {
        return false;
      }

      // Completeness filter
      if (completenessFilter === 'incomplete' && !isFlatIncomplete(flat)) {
        return false;
      }
      if (completenessFilter === 'complete' && isFlatIncomplete(flat)) {
        return false;
      }

      // Search query (Location / Owner / Project / Developer / Contact / Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesLocation = (flat.location || '').toLowerCase().includes(q);
        const matchesProject = (flat.projectName || '').toLowerCase().includes(q);
        const matchesDeveloper = (flat.developerName || '').toLowerCase().includes(q);
        const matchesContact = (flat.contactPerson || '').toLowerCase().includes(q);
        const matchesOwner = (flat.ownerName || '').toLowerCase().includes(q);
        const matchesPhone = (flat.phoneNumber || '').toLowerCase().includes(q);
        const matchesBuilding = (flat.plotHouseNo || flat.buildingHouseNo || '').toLowerCase().includes(q);
        const matchesCollector = (flat.collectedBy || flat.createdBy || '').toLowerCase().includes(q);

        if (
          !matchesLocation && 
          !matchesProject && 
          !matchesDeveloper && 
          !matchesContact && 
          !matchesOwner && 
          !matchesPhone && 
          !matchesBuilding && 
          !matchesCollector
        ) {
          return false;
        }
      }

      return true;
    });
  }, [flats, statusFilter, completenessFilter, searchQuery]);

  // Handlers
  const handleSaveFlat = async (
    payload: Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'>,
    isSaveAndNew: boolean = false
  ) => {
    setIsSaving(true);
    let timer: any = null;
    try {
      const actorName = currentUser?.displayName
        ? `${currentUser.displayName} (${currentUser.email || ''})`
        : currentUser?.email || 'Team Collector';
      const nowIso = new Date().toISOString();

      const savePromise = (async () => {
        if (editingFlat && editingFlat.id) {
          // Edit existing record: preserve original createdBy / createdAt
          const updatePayload: Partial<FlatRecord> = {
            ...payload,
            updatedBy: actorName,
            updatedAt: nowIso,
          };
          await updateFlatRecord(editingFlat.id, updatePayload);
        } else {
          // New record
          const createPayload = {
            ...payload,
            createdBy: actorName,
            createdAt: nowIso,
            updatedBy: actorName,
            updatedAt: nowIso,
            collectedBy: actorName,
            collectedByUid: currentUser?.uid || '',
            collectedByEmail: currentUser?.email || '',
          };
          await addFlatRecord(createPayload, currentUser.uid, currentUser.email || '');
        }
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const timeoutErr: any = new Error(
            'Save is taking too long. Check your internet connection and try again.'
          );
          timeoutErr.code = 'timeout';
          reject(timeoutErr);
        }, 15000);
      });

      await Promise.race([savePromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      showToast('Saved');

      if (isSaveAndNew) {
        setEditingFlat(null);
        setViewMode('add');
      } else {
        setViewMode('list');
        setEditingFlat(null);
      }
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      console.error('Error saving flat:', err);
      const msg = err.message || 'Failed to save property entry. Please try again.';
      showToast(msg, 'error');
      // Re-throw so FlatForm catches it and displays the visible red banner with Copy details
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFlat || !deletingFlat.id) return;
    setIsDeleting(true);
    let timer: any = null;
    try {
      const deletePromise = deleteFlatRecord(deletingFlat.id);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const timeoutErr: any = new Error(
            'Delete is taking too long. Check your internet connection and try again.'
          );
          timeoutErr.code = 'timeout';
          reject(timeoutErr);
        }, 15000);
      });
      await Promise.race([deletePromise, timeoutPromise]);
      if (timer) clearTimeout(timer);
      showToast('Flat entry deleted from shared database.');
      setDeletingFlat(null);
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      console.error('Delete error:', err);
      showToast(err.message || 'Failed to delete record. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = (flat: FlatRecord) => {
    setEditingFlat(flat);
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDirectExportCSV = () => {
    if (flats.length === 0) {
      showToast('No flats available to export.', 'error');
      return;
    }
    exportFlatsToCSV(flats);
    showToast(`Exported ${flats.length} flats as CSV.`);
  };

  // Auth Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-[#1B262C] text-[#D35400] flex items-center justify-center shadow-md mb-4 font-bold text-2xl">
          P
        </div>
        <div className="w-6 h-6 border-3 border-[#D35400] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#1B262C]">Loading PropMarty...</p>
      </div>
    );
  }

  // Not signed in -> Show Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Quick stats summary
  const availableCount = flats.filter((f) => f.listingStatus === 'Available').length;
  const onHoldCount = flats.filter((f) => f.listingStatus === 'On Hold').length;

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1B262C] flex flex-col selection:bg-[#D35400] selection:text-white">
      
      {/* App Navigation Bar */}
      <Navbar
        user={currentUser}
        onNewEntry={() => {
          setEditingFlat(null);
          setViewMode('add');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onExportCSV={handleDirectExportCSV}
        onSignOut={() => logOut()}
        currentView={viewMode}
        onNavigateHome={() => {
          setViewMode('list');
          setEditingFlat(null);
        }}
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-fade-in shadow-xl rounded-xl overflow-hidden pointer-events-auto">
          <div
            className={`p-4 flex items-start gap-3 border ${
              toastMessage.type === 'success'
                ? 'bg-[#1B262C] text-white border-gray-700'
                : toastMessage.type === 'info'
                ? 'bg-[#1E293B] text-white border-blue-500/50 shadow-md'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : toastMessage.type === 'info' ? (
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-400/40">
                <span className="text-xs font-bold font-mono">i</span>
              </div>
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium leading-snug flex items-center justify-between">
              <span>{toastMessage.text}</span>
              {toastMessage.onUndo && (
                <button
                  onClick={() => {
                    toastMessage.onUndo?.();
                    setToastMessage(null);
                  }}
                  className="ml-3 px-2.5 py-1 rounded-lg bg-white/25 hover:bg-white/40 text-white text-xs font-bold transition cursor-pointer"
                >
                  Undo
                </button>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white transition p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-8 sm:pt-10 pb-[calc(96px+env(safe-area-inset-bottom))]">
        <ErrorBoundary fallbackTitle="Something went wrong on this screen">
          {/* VIEW: ADD OR EDIT ENTRY */}
          {(viewMode === 'add' || viewMode === 'edit') && (
            <FlatForm
              initialFlat={editingFlat}
              currentUser={currentUser}
              existingFlats={flats}
              onSave={handleSaveFlat}
              onCancel={() => {
                setViewMode('list');
                setEditingFlat(null);
              }}
              onOpenExisting={(target) => {
                setEditingFlat(null);
                setDetailFlat(target);
                setViewMode('list');
              }}
              isSaving={isSaving}
              onShowToast={showToast}
            />
          )}

          {/* VIEW: ALL FLATS LIST (HOME PAGE) */}
          {viewMode === 'list' && (
            <div>
            
            {/* Header Title & Mobile Quick Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1B262C] tracking-tight">
                    All Flats Directory
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8E2D8] text-gray-700">
                    {flats.length} total
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Shared team workspace • Entries synchronized to Firestore
                </p>
                {isAdmin && (
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAllFlats}
                        onChange={(e) => setShowAllFlats(e.target.checked)}
                        className="rounded border-gray-300 text-[var(--pine)] focus:ring-[var(--pine)]"
                      />
                      Show All Users
                    </label>
                    <button
                        onClick={async () => {
                            if (confirm('Fix all missing ownerId records?')) {
                                await fixOldEntries(currentUser!.uid, currentUser!.email || '');
                                showToast('Fix complete');
                            }
                        }}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer underline"
                    >
                        Fix old entries
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Backup, Import & Export Buttons */}
              <div className="flex items-center gap-1.5 sm:hidden">
                <button
                  id="mobile-backup-btn"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold bg-[#1B262C] text-white border border-[#2D3A42] min-h-[44px]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup</span>
                </button>
                <button
                  id="mobile-import-btn"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold bg-[#2D3A42] text-white border border-gray-600 min-h-[44px]"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import</span>
                </button>
                <button
                  id="mobile-export-btn"
                  onClick={handleDirectExportCSV}
                  className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-xs font-semibold bg-white text-gray-800 border border-gray-200 min-h-[44px]"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Live KPI Dashboard (Real-time counters & filter shortcuts) */}
            <KPIDashboard 
              flats={flats}
              currentStatus={statusFilter}
              completenessFilter={completenessFilter}
              onSelectStatus={setStatusFilter}
              onSelectCompleteness={setCompletenessFilter}
            />

            {/* Search Bar and Status & Completeness Filter Controls */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
              
              {/* Search input (Location / Project / Developer / Owner / Phone) */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="flats-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Location, Project, Owner, or Phone..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-[#FAF9F6] text-[#1B262C] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400]/25 focus:border-[#D35400] text-sm min-h-[44px]"
                />
                {searchQuery && (
                  <button
                    id="clear-search-btn"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Clear Search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Dropdown Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <select
                    id="status-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-[40px] px-3.5 py-1.5 rounded-xl border border-[var(--rule)] bg-[var(--surface)] text-[var(--ink)] font-semibold text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--pine)] cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                {/* Data Completeness Dropdown Filter */}
                <div className="relative flex-1 md:w-48">
                  <select
                    id="completeness-filter-select"
                    value={completenessFilter}
                    onChange={(e) => setCompletenessFilter(e.target.value as any)}
                    className="w-full h-[40px] px-3.5 py-1.5 rounded-xl border border-[var(--rule)] bg-[var(--surface)] text-[var(--ink)] font-semibold text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--pine)] cursor-pointer"
                  >
                    <option value="all">Data: All</option>
                    <option value="incomplete">Incomplete only</option>
                    <option value="complete">Complete only</option>
                  </select>
                </div>
              </div>

            </div>

            {/* View Switcher: Cards | Table | Pipeline & Group By */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <div className="w-full sm:w-auto inline-flex bg-[var(--surface-2)] p-1 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveListMode('cards')}
                  style={{
                    backgroundColor: activeListMode === 'cards' ? 'var(--pine)' : 'transparent',
                    color: activeListMode === 'cards' ? '#fff' : 'var(--ink-2)',
                  }}
                  className="flex-1 sm:flex-initial px-5 h-[40px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center"
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListMode('table')}
                  style={{
                    backgroundColor: activeListMode === 'table' ? 'var(--pine)' : 'transparent',
                    color: activeListMode === 'table' ? '#fff' : 'var(--ink-2)',
                  }}
                  className="flex-1 sm:flex-initial px-5 h-[40px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center"
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListMode('pipeline')}
                  style={{
                    backgroundColor: activeListMode === 'pipeline' ? 'var(--pine)' : 'transparent',
                    color: activeListMode === 'pipeline' ? '#fff' : 'var(--ink-2)',
                  }}
                  className="flex-1 sm:flex-initial px-5 h-[40px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center"
                >
                  Pipeline
                </button>
              </div>

              {/* Group By Control (Hidden in Pipeline view) */}
              {activeListMode !== 'pipeline' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--ink-2)]">Group by:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="px-3 h-[40px] rounded-xl bg-white border border-[var(--rule)] font-semibold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--pine)] cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="area">Area</option>
                    <option value="status">Availability</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {dataError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{dataError}</p>
                  <p className="text-xs text-rose-700 mt-0.5">Please check network or security rules.</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {dataLoading && (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-[#D35400] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#1B262C]">Syncing properties from team database...</p>
              </div>
            )}

            {/* Empty State when no flats exist */}
            {!dataLoading && flats.length === 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-8 sm:p-14 text-center max-w-xl mx-auto my-6 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#EAE5DB] text-[#D35400] flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1B262C] mb-2">
                  No flats added yet
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Tap '+ New Entry' to get started logging properties and flat owner details from signboards.
                </p>
                <button
                  id="empty-state-new-entry-btn"
                  onClick={() => {
                    setEditingFlat(null);
                    setViewMode('add');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D35400] text-white hover:bg-[#A04000] font-bold text-sm shadow-sm transition min-h-[48px] cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ New Entry</span>
                </button>
              </div>
            )}

            {/* Empty Search / Filter Result */}
            {!dataLoading && flats.length > 0 && filteredFlats.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center my-6">
                <p className="text-base font-bold text-[#1B262C] mb-1">
                  No property records match your search
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Try adjusting your keywords or clearing the status filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#EAE5DC] text-[#1B262C] text-xs font-semibold hover:bg-[#DDD8CF] transition min-h-[40px]"
                >
                  Reset Filter & Search
                </button>
              </div>
            )}

            {/* Main Render based on View Mode and Group By */}
            {!dataLoading && filteredFlats.length > 0 && (
              <>
                {activeListMode === 'pipeline' ? (
                  <PipelineView 
                    flats={filteredFlats} 
                    onViewDetails={(item) => setDetailFlat(item)} 
                    onEdit={handleStartEdit}
                    onDelete={(item) => setDeletingFlat(item)}
                    onContactStatusChange={handleContactStatusChange} 
                  />
                ) : groupBy !== 'none' ? (
                  <div className="space-y-6">
                    {Object.entries(
                      filteredFlats.reduce((acc: Record<string, FlatRecord[]>, flat) => {
                        let key = 'No area';
                        if (groupBy === 'area') {
                          key = flat.area && flat.area.trim() ? flat.area.trim() : 'No area';
                        } else if (groupBy === 'status') {
                          key = flat.listingStatus || 'Available';
                        }
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(flat);
                        return acc;
                      }, {})
                    ).map(([groupName, groupFlats]) => (
                      <div key={groupName} className="space-y-3">
                        <div className="sticky top-16 z-10 bg-[#F3EEE3] py-2 px-4 font-bold text-sm text-[#1B262C] border-b border-[#D8D0BF] flex items-center justify-between shadow-xs rounded-xl">
                          <span>{groupName}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#E8E2D8] text-gray-700 font-bold">
                            {groupFlats.length}
                          </span>
                        </div>
                        {activeListMode === 'table' ? (
                          <TableView 
                            flats={groupFlats} 
                            onViewDetails={(item) => setDetailFlat(item)} 
                            onEdit={handleStartEdit}
                            onStatusChange={handleStatusChange}
                            onContactStatusChange={handleContactStatusChange}
                          />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {groupFlats.map((flat) => (
                              <FlatCard
                                key={flat.id}
                                flat={flat}
                                onViewDetails={(item) => setDetailFlat(item)}
                                onEdit={handleStartEdit}
                                onDelete={(item) => setDeletingFlat(item)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : activeListMode === 'table' ? (
                  <TableView 
                    flats={filteredFlats} 
                    onViewDetails={(item) => setDetailFlat(item)} 
                    onEdit={handleStartEdit}
                    onStatusChange={handleStatusChange}
                    onContactStatusChange={handleContactStatusChange}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFlats.map((flat) => (
                      <FlatCard
                        key={flat.id}
                        flat={flat}
                        onViewDetails={(item) => setDetailFlat(item)}
                        onEdit={handleStartEdit}
                        onDelete={(item) => setDeletingFlat(item)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Floating Action Button for Mobile Field Workers */}
            {viewMode === 'list' && !detailFlat && !deletingFlat && !isBackupModalOpen && !isImportModalOpen && (
              <div className="sm:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20">
                <button
                  id="floating-add-btn"
                  type="button"
                  onClick={() => {
                    setEditingFlat(null);
                    setViewMode('add');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ backgroundColor: 'var(--clay)' }}
                  className="w-[56px] h-[56px] rounded-full text-white shadow-xl flex items-center justify-center transition hover:opacity-90 active:scale-95 cursor-pointer"
                  aria-label="New entry"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}

          </div>
        )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-gray-200 bg-[#ECE8E1] text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-[#1B262C]">PropMarty</span>
            <span>•</span>
            <span>Clean Minimalist Property Field Data Collection</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-[#D35400] hover:underline font-semibold cursor-pointer"
            >
              Drive Backup
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Import Sheet
            </button>
            <button
              onClick={handleDirectExportCSV}
              className="hover:text-[#1B262C] transition font-medium cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FlatDetailModal
        flat={detailFlat}
        isOpen={!!detailFlat}
        onClose={() => setDetailFlat(null)}
        onEdit={(item) => {
          setDetailFlat(null);
          handleStartEdit(item);
        }}
        onDelete={(item) => {
          setDetailFlat(null);
          setDeletingFlat(item);
        }}
        onDuplicate={handleDuplicateFlat}
        onStatusChange={handleStatusChange}
        onContactStatusChange={handleContactStatusChange}
        onShowToast={showToast}
      />

      <DeleteConfirmModal
        flat={deletingFlat}
        isOpen={!!deletingFlat}
        isDeleting={isDeleting}
        onCancel={() => setDeletingFlat(null)}
        onConfirm={handleConfirmDelete}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        flats={flats}
      />

      <ImportSheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingFlats={flats}
        onImportComplete={(msg) => showToast(msg, 'success')}
        currentUser={currentUser!}
      />

    </div>
  );
}
