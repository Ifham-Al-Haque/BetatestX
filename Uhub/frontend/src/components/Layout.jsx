import React from "react";
import Sidebar from "./Sidebar";
import UserDropdown from "./UserDropdown";
import DarkModeToggle from "./DarkModeToggle";
import { useSidebar } from "../context/SidebarContext";
import Logo from "./ui/logo";
import "./Sidebar.css";

const Layout = ({ children }) => {
  const { sidebarWidth, isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #ffffffff 0%, #fdfeffff 100%)" }}>
      <Sidebar />
      <main 
        className={`main-content p-10 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'sidebar-collapsed' : ''
        }`}
        style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100vw - ${sidebarWidth}px)` }}
      >
        {/* Header with user controls */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <Logo size="lg" showText={false} />
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Uhub Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Unified platform for all departments</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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