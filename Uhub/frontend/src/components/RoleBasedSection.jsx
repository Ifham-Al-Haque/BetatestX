import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function RoleBasedSection({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  className = "" 
}) {
  const { role } = useAuth();

  // If no roles specified, allow all
  if (allowedRoles.length === 0) {
    return <div className={className}>{children}</div>;
  }

  // Check if user has required role
  if (allowedRoles.includes(role)) {
    return <div className={className}>{children}</div>;
  }

  // Return fallback or null
  return fallback;
}

// Convenience components for common roles
export function AdminOnly({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
}

export function ManagerAndAbove({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin', 'manager']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
}

export function EmployeeAndAbove({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
}

export function HRManagerAndAbove({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin', 'hr_manager']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
}

export function CSManagerAndAbove({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin', 'hr_manager', 'cs_manager']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
}

export function DriverManagementAndAbove({ children, fallback = null, className = "" }) {
  return (
    <RoleBasedSection 
      allowedRoles={['admin', 'manager', 'driver_management']} 
      fallback={fallback}
      className={className}
    >
      {children}
    </RoleBasedSection>
  );
} 