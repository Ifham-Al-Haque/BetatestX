import React from 'react';
import Logo from './logo';
import Favicon from './favicon';

const LogoShowcase = () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const variants = ['default', 'positive', 'negative'];

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Uhub Logo System</h2>
      <p className="text-gray-600 mb-6">Unified platform branding for all departments</p>
      
      {/* Main Logo Variants */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Main Logo Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <div key={variant} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-3 capitalize">{variant}</h4>
              <Logo size="lg" variant={variant} showText={true} centered={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Logo Sizes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Logo Sizes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sizes.map((size) => (
            <div key={size} className="p-3 border border-gray-200 rounded-lg text-center">
              <div className="mb-2">
                <Logo size={size} showText={false} />
              </div>
              <span className="text-xs text-gray-500 uppercase">{size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logo with Text Sizes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Logo with Text</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sizes.slice(1).map((size) => (
            <div key={size} className="p-3 border border-gray-200 rounded-lg">
              <div className="mb-2">
                <Logo size={size} showText={true} />
              </div>
              <span className="text-xs text-gray-500 uppercase">{size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Favicon Variants */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Icon Variants</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {variants.map((variant) => (
            <div key={variant} className="p-3 border border-gray-200 rounded-lg text-center">
              <div className="mb-2 flex justify-center">
                <Favicon size="md" variant={variant} />
              </div>
              <span className="text-xs text-gray-500 capitalize">{variant}</span>
            </div>
          ))}
          <div className="p-3 border border-gray-200 rounded-lg text-center">
            <div className="mb-2 flex justify-center">
              <Favicon size="md" variant="favicon" />
            </div>
            <span className="text-xs text-gray-500">Favicon</span>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Usage Examples</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Header Navigation</h4>
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
              <Logo size="sm" showText={true} compact={true} />
              <div className="flex space-x-4 text-sm text-gray-600">
                <span>Dashboard</span>
                <span>Employees</span>
                <span>Assets</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sidebar</h4>
            <div className="flex items-center p-3 bg-white border border-gray-200 rounded">
              <Logo size="sm" showText={true} compact={true} />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Login Page</h4>
            <div className="text-center p-6 bg-white border border-gray-200 rounded">
              <Logo size="xl" showText={true} centered={true} className="mb-4" />
              <p className="text-gray-600">Welcome to Uhub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;
