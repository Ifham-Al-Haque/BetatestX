import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isOperationEdition, isPathAllowedInEdition, OPERATION_HOME_PATH } from '../config/edition';

// In the "operation" edition, keep users inside the Operation/Fleet area.
// Any non-allowed top-level path is redirected to the operation home.
const EditionGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOperationEdition) return;
    if (!isPathAllowedInEdition(location.pathname)) {
      navigate(OPERATION_HOME_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default EditionGuard;
