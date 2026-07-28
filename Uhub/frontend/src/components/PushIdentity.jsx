import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setExternalUserId, clearExternalUserId } from '../services/pushService';

// Links the OneSignal device to the logged-in user (auth id) so pushes can be
// targeted to them. No-ops unless OneSignal is configured.
const PushIdentity = () => {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const syncIdentity = async () => {
      if (cancelled) return;
      if (user?.id) {
        await setExternalUserId(user.id);
      } else {
        await clearExternalUserId();
      }
    };

    syncIdentity();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
};

export default PushIdentity;
