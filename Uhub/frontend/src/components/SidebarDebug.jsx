import React from 'react';
import Sidebar from './Sidebar';

const SidebarDebug = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-blue-500 text-white p-4">
        <h2 className="text-lg font-bold">Sidebar Debug</h2>
        <p>This is a test sidebar</p>
      </div>
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p>If you can see this, the layout is working.</p>
      </div>
    </div>
  );
};

export default SidebarDebug; 