import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setExternalUserId } from '../services/pushService';

// Links this browser/phone to the UHub user (auth id) so OneSignal can deliver
// leave/HR alerts even after they sign out. We do not unlink on logout — only
// switch identity when a different person signs in on this device.
const PushIdentity = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return undefined;
    setExternalUserId(user.id).catch(() => {});
    return undefined;
  }, [user?.id]);

  return null;
};

export default PushIdentity;
