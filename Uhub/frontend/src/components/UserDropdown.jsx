import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

export default function UserDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { isMobile } = useSidebar();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = userProfile?.full_name || user?.email || "User";
  const initials = (userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();
  const mobileName = isMobile && displayName.length > 15
    ? displayName.substring(0, 12) + '...'
    : displayName;

  const menuItemClass =
    "w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors duration-200 touch-manipulation hover:bg-surface-overlay text-content-secondary hover:text-content-primary";

  return (
    <div className="relative user-dropdown-container">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 h-11 rounded-xl border transition-all duration-200 touch-manipulation flex-shrink-0"
        style={{
          background: 'var(--surface-raised)',
          borderColor: 'var(--border-primary)',
          minWidth: isMobile ? '44px' : undefined,
          WebkitTapHighlightColor: 'transparent'
        }}
        aria-label="User menu"
        aria-expanded={showDropdown}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {initials}
        </div>
        {!isMobile && (
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-sm font-medium text-content-primary truncate max-w-[120px]">
              {displayName}
            </p>
            <p className="text-xs text-content-muted capitalize truncate max-w-[120px]">
              {userProfile?.role || "User"}
            </p>
          </div>
        )}
        {isMobile && (
          <p className="text-xs font-medium text-content-primary truncate max-w-[72px] sm:hidden">
            {mobileName}
          </p>
        )}
        <ChevronDown
          className={`w-4 h-4 text-content-muted flex-shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      {showDropdown && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
              onClick={() => setShowDropdown(false)}
            />
          )}
          <div
            className={`absolute right-0 top-full mt-2 z-50 rounded-xl border overflow-hidden shadow-xl ${
              isMobile ? 'w-56' : 'w-52'
            }`}
            style={{
              background: 'var(--surface-base)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--surface-raised)' }}
            >
              <p className="font-medium text-sm text-content-primary truncate">{displayName}</p>
              <p className="text-xs text-content-muted capitalize mt-0.5 truncate">
                {userProfile?.role || "User"}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                className={menuItemClass}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => { navigate('/profile?tab=preferences'); setShowDropdown(false); }}
                className={menuItemClass}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
            <div className="border-t py-1" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-accent-danger hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
