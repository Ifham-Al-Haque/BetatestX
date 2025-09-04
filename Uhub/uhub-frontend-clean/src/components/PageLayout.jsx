import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';

const PageLayout = ({ children, className = '', showSidebar = true }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="page-container">
      {showSidebar && <Sidebar />}
      
      <div className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''} ${className}`}>
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;

