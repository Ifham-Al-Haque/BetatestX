import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, ChevronRight } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

export default function UserDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { isMobile } = useSidebar();

  // Close dropdown when clicking outside
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

  // Truncate long names for mobile
  const displayName = userProfile?.full_name || user?.email || "User";
  const mobileName = isMobile && displayName.length > 15 
    ? displayName.substring(0, 12) + '...' 
    : displayName;

  return (
    <div className="relative text-right user-dropdown-container">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center ${isMobile ? 'p-2 space-x-2' : 'p-3 space-x-3'} bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 rounded-full transition-all duration-200 cursor-pointer touch-manipulation`}
        style={{
          minWidth: isMobile ? '44px' : undefined,
          minHeight: isMobile ? '44px' : undefined,
          WebkitTapHighlightColor: 'transparent'
        }}
        aria-label="User menu"
      >
        <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] rounded-full flex items-center justify-center flex-shrink-0`}>
          <User className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
        </div>
        {!isMobile && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userProfile?.role || "User"}
            </p>
          </div>
        )}
        {isMobile && (
          <div className="text-right sm:hidden">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[80px]">
              {mobileName}
            </p>
          </div>
        )}
        <ChevronRight className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-400 dark:text-gray-300 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-90' : ''}`} />
      </button>

      {showDropdown && (
        <>
          {/* Mobile overlay */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setShowDropdown(false)}
            />
          )}
          <div 
            className={`absolute ${isMobile ? 'right-0 top-full mt-2 w-56' : 'right-0 mt-2 w-48'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50`}
            style={{
              minWidth: isMobile ? '200px' : undefined
            }}
          >
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <p className="font-medium truncate">{userProfile?.full_name || user?.email || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                {userProfile?.role || "User"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors duration-200 touch-manipulation"
              style={{
                minHeight: '44px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
