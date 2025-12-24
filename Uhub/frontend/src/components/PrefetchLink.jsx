import { Link, useLocation } from 'react-router-dom';
import { usePrefetch } from '../hooks/usePrefetch';
import { useCallback, useRef } from 'react';

/**
 * Enhanced Link component that prefetches data on hover
 * Usage: <PrefetchLink to="/task-management" prefetchKey="task-management">Tasks</PrefetchLink>
 */
const PrefetchLink = ({ 
  to, 
  children, 
  prefetchKey = null, 
  className = '',
  onMouseEnter,
  onMouseLeave,
  ...props 
}) => {
  const location = useLocation();
  const { prefetchRoute } = usePrefetch();
  const isActive = location.pathname === to;
  const prefetchedRef = useRef(false);
  const timeoutRef = useRef(null);

  // Use provided prefetchKey or derive from route
  const keyToPrefetch = prefetchKey || to;

  const handleMouseEnter = useCallback((e) => {
    // Call original onMouseEnter if provided
    if (onMouseEnter) {
      onMouseEnter(e);
    }

    // Prefetch data for the route (debounced and cached)
    if (!isActive && keyToPrefetch && !prefetchedRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        prefetchedRef.current = true;
        prefetchRoute(keyToPrefetch).catch(err => {
          // Reset on error so it can be retried
          prefetchedRef.current = false;
          console.debug('Prefetch failed for', keyToPrefetch, err);
        });
      }, 300); // 300ms debounce
    }
  }, [isActive, keyToPrefetch, prefetchRoute, onMouseEnter]);

  return (
    <Link
      to={to}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;

