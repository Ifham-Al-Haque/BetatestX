import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recordModuleVisit } from '../utils/recentModules';

const RouteVisitTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    recordModuleVisit(location.pathname);
  }, [location.pathname, user?.id]);

  return null;
};

export default RouteVisitTracker;
