import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  LogOut, 
  User as UserIcon,
  DownloadCloud,
  Search,
  MoreVertical
} from 'lucide-react';
import type { User } from '../firebase.ts';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  onOpenBackup: () => void;
  onOpenImport: () => void;
  onExportCSV: () => void;
  onSignOut: () => void;
  currentView: 'list' | 'add' | 'edit';
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  onOpenBackup,
  onOpenImport,
  onExportCSV,
  onSignOut,
  currentView,
  onNavigateHome,
}) => {
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFocusSearch = () => {
    onNavigateHome();
    const searchInput = document.getElementById('flats-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      {/* Mobile Header (<640px): 52px height, non-sticky */}
      <header className="sm:hidden bg-[#1B262C] text-white h-[52px] px-3 flex items-center justify-between border-b border-[#2A3841] relative z-35">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-left focus:outline-none cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-[#D35400] flex items-center justify-center text-white font-bold text-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">PropMarty</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Search Icon Button (44x44px) */}
          <button
            type="button"
            onClick={handleFocusSearch}
            className="w-[44px] h-[44px] flex items-center justify-center text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Avatar Menu Button (44x44px) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowAvatarMenu(prev => !prev)}
              className="w-[44px] h-[44px] flex items-center justify-center text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
              title="Menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#2D3A42] text-white flex items-center justify-center border border-gray-500 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-4 h-4 text-gray-300" />
                )}
              </div>
            </button>

            {showAvatarMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 text-xs text-gray-800 font-sans">
                {user && (
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-bold text-gray-900 truncate">{user.displayName || 'Field User'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setShowAvatarMenu(false); onOpenBackup(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Backup to Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAvatarMenu(false); onOpenImport(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  <DownloadCloud className="w-4 h-4 text-blue-600" />
                  <span>Import from Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAvatarMenu(false); onExportCSV(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span>Export CSV</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => { setShowAvatarMenu(false); onSignOut(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop / Tablet Header (≥640px): sticky */}
      <header 
        id="main-app-header" 
        className="hidden sm:block sticky top-0 z-30 bg-[#1B262C] text-white shadow-sm border-b border-[#2A3841]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Logo & Brand */}
            <button 
              id="brand-logo-btn"
              onClick={onNavigateHome}
              className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D35400] rounded-lg py-1 px-1.5 transition hover:opacity-90 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#D35400] flex items-center justify-center text-white font-bold text-xl shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-white">PropMarty</span>
                  <span className="hidden xs:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#2D3A42] text-gray-300 tracking-wider">
                    Field Team
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-normal leading-none hidden sm:block">
                  Property Field Data Collection
                </p>
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {currentView === 'list' && (
                <>
                  <button
                    id="header-backup-drive-btn"
                    onClick={onOpenBackup}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#2D3A42] text-white hover:bg-[#384852] transition-colors border border-gray-600/40 min-h-[42px] cursor-pointer"
                    title="Backup to Google Drive / Sheets"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Backup to Drive</span>
                  </button>

                  <button
                    id="header-import-sheet-btn"
                    onClick={onOpenImport}
                    className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#2D3A42] text-white hover:bg-[#384852] transition-colors border border-gray-600/40 min-h-[42px] cursor-pointer"
                    title="Import and sync changes from Google Sheet"
                  >
                    <DownloadCloud className="w-4 h-4 text-blue-400" />
                    <span>Import from Sheet</span>
                  </button>

                  <button
                    id="header-export-csv-btn"
                    onClick={onExportCSV}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#2D3A42] text-white hover:bg-[#384852] transition-colors border border-gray-600/40 min-h-[42px] cursor-pointer"
                    title="Export all records as CSV file"
                  >
                    <Download className="w-4 h-4 text-gray-300" />
                    <span>CSV</span>
                  </button>

                  <button
                    id="header-new-entry-btn"
                    onClick={onNewEntry}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#D35400] text-white hover:bg-[#A04000] active:scale-[0.98] shadow-sm transition-all min-h-[42px] min-w-[44px] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Entry</span>
                  </button>
                </>
              )}

              {currentView !== 'list' && (
                <button
                  id="header-back-to-list-btn"
                  onClick={onNavigateHome}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#2D3A42] text-white hover:bg-[#384852] transition-colors border border-gray-600/40 min-h-[42px]"
                >
                  Back to All Flats
                </button>
              )}

              {/* User Profile & Sign Out */}
              {user && (
                <div className="flex items-center gap-2 pl-3 border-l border-gray-600">
                  <div 
                    className="w-8 h-8 rounded-full bg-[#2D3A42] text-white flex items-center justify-center border border-gray-500 overflow-hidden"
                    title={`${user.displayName || 'User'} (${user.email})`}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-300" />
                    )}
                  </div>

                  <button
                    id="header-logout-btn"
                    onClick={onSignOut}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2D3A42] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
};
