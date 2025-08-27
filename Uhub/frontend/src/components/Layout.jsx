import React from "react";
import Sidebar from "./Sidebar";
import UserDropdown from "./UserDropdown";
import DarkModeToggle from "./DarkModeToggle";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./ui/logo";
import { NotificationContainer } from "./notifications";

const Layout = ({ children, pageTitle = "Uhub Dashboard", pageDescription = "Unified platform for all departments" }) => {
  const { sidebarWidth, isCollapsed } = useSidebar();
  const { isDark } = useTheme();
  
  console.log('🔍 Layout component rendering:', { sidebarWidth, isCollapsed, isDark });

  const backgroundGradient = isDark 
    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";

  return (
    <div className="min-h-screen font-sans flex transition-all duration-500" style={{ background: backgroundGradient }}>
      {/* Sidebar */}
      <div className="flex-shrink-0" key="main-sidebar">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main 
        className="flex-1 p-10 transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: 0, // Remove margin since sidebar is now flex-based
          width: 'auto' // Let flex handle the width
        }}
      >
        {/* Header with user controls */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <Logo size="lg" showText={false} />
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300">
                {pageTitle}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                {pageDescription}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationContainer />
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>
        
        {/* Page content */}
        <div className="transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 