import React from 'react';
import LogoShowcase from '../components/ui/LogoShowcase';
import Layout from '../components/Layout';

const LogoTest = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Uhub Logo System Test Page</h1>
          <p className="text-gray-600">
            This page demonstrates all available logo variants, sizes, and usage examples for the Uhub unified platform branding system.
          </p>
        </div>
        
        <LogoShowcase />
        
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Implementation Notes</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Use <code className="bg-blue-100 px-1 rounded">Logo</code> component for main branding elements</li>
            <li>• Use <code className="bg-blue-100 px-1 rounded">Favicon</code> component for small icons and favicons</li>
            <li>• Available sizes: xs, sm, md, lg, xl, 2xl</li>
            <li>• Available variants: default, positive, negative</li>
            <li>• Use <code className="bg-blue-100 px-1 rounded">centered</code> prop for center alignment</li>
            <li>• Use <code className="bg-blue-100 px-1 rounded">compact</code> prop for tighter spacing</li>
            <li>• Branding reflects Uhub as a unified platform for all departments</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default LogoTest;
