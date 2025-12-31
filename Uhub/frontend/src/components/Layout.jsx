import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import UserDropdown from "./UserDropdown";
import DarkModeToggle from "./DarkModeToggle";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./ui/logo";
import { NotificationContainer } from "./notifications";
import { Menu } from "lucide-react";

const Layout = ({ children, pageTitle = "Uhub Dashboard", pageDescription = "Unified platform for all departments" }) => {
  const { sidebarWidth, isCollapsed, isMobile, isMobileOpen, toggleSidebar } = useSidebar();
  const { isDark } = useTheme();
  
  console.log('🔍 Layout component rendering:', { sidebarWidth, isCollapsed, isDark, isMobile });

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobile, isMobileOpen]);

  const backgroundGradient = isDark 
    ? "var(--gradient-primary)"
    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";

  return (
    <div 
      className="min-h-screen font-sans flex transition-all duration-500 relative" 
      style={{ 
        background: isDark ? 'var(--bg-primary)' : backgroundGradient,
        color: 'var(--text-primary)'
      }}
    >
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`flex-shrink-0 transition-all duration-300 ${
          isMobile ? 'fixed left-0 top-0 h-full z-50' : ''
        } ${isMobile && !isMobileOpen ? '-translate-x-full' : ''}`}
        key="main-sidebar"
      >
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isMobile ? 'w-full' : ''
        } ${isMobile ? 'p-3' : 'p-4 sm:p-6 md:p-8 lg:p-10'}`}
        style={{ 
          marginLeft: isMobile ? 0 : 0,
          width: 'auto',
          // iOS safe area insets
          paddingTop: isMobile ? 'max(0.75rem, env(safe-area-inset-top))' : undefined,
          paddingBottom: isMobile ? 'max(0.75rem, env(safe-area-inset-bottom))' : undefined,
          paddingLeft: isMobile ? 'max(0.75rem, env(safe-area-inset-left))' : undefined,
          paddingRight: isMobile ? 'max(0.75rem, env(safe-area-inset-right))' : undefined
        }}
      >
        {/* Sticky Header for Mobile */}
        <div 
          className={`${isMobile ? 'sticky top-0 z-30 bg-opacity-95 backdrop-blur-sm' : ''} ${
            isMobile ? 'mb-4 pb-3 border-b' : 'mb-6 sm:mb-8 md:mb-10'
          }`}
          style={{
            background: isMobile ? (isDark ? 'var(--bg-primary)' : 'rgba(255, 255, 255, 0.95)') : 'transparent',
            borderColor: isMobile ? 'var(--border-primary)' : 'transparent',
            paddingTop: isMobile ? '0.5rem' : '0',
            marginTop: isMobile ? '-0.75rem' : '0',
            marginLeft: isMobile ? '-0.75rem' : '0',
            marginRight: isMobile ? '-0.75rem' : '0',
            paddingLeft: isMobile ? '0.75rem' : '0',
            paddingRight: isMobile ? '0.75rem' : '0'
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto min-w-0">
              {/* Mobile Menu Button - Larger touch target */}
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="flex-shrink-0 p-2.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors touch-manipulation"
                  aria-label="Toggle menu"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <div className="flex-shrink-0">
                <Logo size={isMobile ? "sm" : "lg"} showText={false} />
              </div>
              <div className="flex-1 sm:flex-none min-w-0">
                <h1 
                  className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300 truncate`}
                  style={{
                    lineHeight: isMobile ? '1.2' : '1.3'
                  }}
                >
                  {pageTitle}
                </h1>
                {!isMobile && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end flex-shrink-0">
              <NotificationContainer />
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <div 
          className="transition-all duration-300"
          style={{
            // Better mobile spacing
            marginTop: isMobile ? '0.5rem' : '0'
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 