import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import UserDropdown from "./UserDropdown";
import DarkModeToggle from "./DarkModeToggle";
import { useSidebar } from "../context/SidebarContext";
import Logo from "./ui/logo";
import { NotificationContainer } from "./notifications";
import { Menu } from "lucide-react";

const Layout = ({ children, pageTitle = "Uhub Dashboard", pageDescription = "Unified platform for all departments" }) => {
  const { isMobile, isMobileOpen, toggleSidebar } = useSidebar();

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

  return (
    <div className="min-h-screen font-sans flex transition-all duration-500 relative bg-uhub-canvas text-content-primary">
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

      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          isMobile ? 'fixed left-0 top-0 h-full z-50' : ''
        } ${isMobile && !isMobileOpen ? '-translate-x-full' : ''}`}
        key="main-sidebar"
      >
        <Sidebar />
      </div>

      <main
        className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${
          isMobile ? 'w-full p-3' : 'p-4 sm:p-6 md:p-8'
        }`}
        style={{
          paddingTop: isMobile ? 'max(0.75rem, env(safe-area-inset-top))' : undefined,
          paddingBottom: isMobile ? 'max(0.75rem, env(safe-area-inset-bottom))' : undefined,
          paddingLeft: isMobile ? 'max(0.75rem, env(safe-area-inset-left))' : undefined,
          paddingRight: isMobile ? 'max(0.75rem, env(safe-area-inset-right))' : undefined
        }}
      >
        <div
          className="sticky top-0 z-30 mb-4 sm:mb-6 rounded-2xl border backdrop-blur-xl"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            paddingTop: isMobile ? 'max(0.5rem, env(safe-area-inset-top))' : '0.75rem',
            paddingBottom: '0.75rem',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 min-h-[52px]">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto min-w-0 self-center">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="flex-shrink-0 p-2.5 rounded-xl border active:opacity-80 transition-all touch-manipulation text-content-primary"
                  style={{
                    background: 'var(--surface-raised)',
                    borderColor: 'var(--border-primary)',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  aria-label="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              {isMobile && (
                <div className="flex-shrink-0">
                  <Logo size="sm" showText={false} />
                </div>
              )}
              <div className="flex-1 sm:flex-none min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-content-primary truncate">
                  {pageTitle}
                </h1>
                {!isMobile && pageDescription && (
                  <p className="text-sm text-content-muted mt-0.5 truncate">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-shrink-0 self-center">
              <NotificationContainer />
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>
        </div>

        <div className="transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
