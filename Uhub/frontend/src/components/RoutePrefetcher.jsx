import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrefetch } from '../hooks/usePrefetch';
import { useAuth } from '../context/AuthContext';

/**
 * Component that prefetches data when routes change
 * Should be placed in the App component to prefetch on navigation
 */
const RoutePrefetcher = () => {
  const location = useLocation();
  const { prefetchRoute } = usePrefetch();
  const { user } = useAuth();
  const prefetchedRoutes = useRef(new Set());

  useEffect(() => {
    // Only prefetch if user is authenticated
    if (!user?.id) {
      return;
    }

    // Prevent duplicate prefetching for the same route
    if (prefetchedRoutes.current.has(location.pathname)) {
      return;
    }

    // Prefetch data for the current route
    const prefetch = async () => {
      try {
        await prefetchRoute(location.pathname);
        prefetchedRoutes.current.add(location.pathname);
      } catch (error) {
        console.warn('Failed to prefetch route:', location.pathname, error);
      }
    };

    prefetch();
  }, [location.pathname, prefetchRoute, user?.id]);

  return null; // This component doesn't render anything
};

export default RoutePrefetcher;

