import React from "react";
import Sidebar from "./Sidebar";
import UserDropdown from "./UserDropdown";
import DarkModeToggle from "./DarkModeToggle";
import { useSidebar } from "../context/SidebarContext";
import Logo from "./ui/logo";
import { NotificationContainer } from "./notifications";

const Layout = ({ children, pageTitle = "Uhub Dashboard", pageDescription = "Unified platform for all departments" }) => {
  const { sidebarWidth, isCollapsed } = useSidebar();
  
  console.log('🔍 Layout component rendering:', { sidebarWidth, isCollapsed });

  return (
    <div className="min-h-screen font-sans flex" style={{ background: "linear-gradient(135deg, #ffffffff 0%, #fdfeffff 100%)" }}>
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
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
              <p className="text-lg text-gray-600 mt-1">{pageDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationContainer />
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>
        
        {/* Page content */}
        {children}
      </main>
    </div>
  );
};

export default Layout; 