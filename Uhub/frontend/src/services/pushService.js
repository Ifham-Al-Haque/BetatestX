// =============================================================================
// Push notifications (OneSignal)
// =============================================================================
// Two halves:
//   1) CLIENT (this file, web): subscribe the browser/device and tag the
//      logged-in user with their auth id as the OneSignal "external id".
//      Activates only when REACT_APP_ONESIGNAL_APP_ID is set.
//   2) SERVER: actually *sending* a push must use the OneSignal REST API key,
//      which must NEVER live in the frontend. We call a Supabase Edge Function
//      ("send-push") that holds the key as a secret. See supabase/functions/send-push.
//
// Note: OneSignal Web SDK v16 may log `PATCH .../identity 409 (Conflict)` in the
// browser console when login() finds an existing external id. OneSignal handles
// this internally (subscription transfer). It is noisy but usually not a bug.
// We still dedupe login calls and logout-before-switch to reduce conflicts.
// =============================================================================
import { supabase } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = process.env.REACT_APP_ONESIGNAL_APP_ID || '';
let initialised = false;
let linkedExternalUserId = null;
let identityQueue = Promise.resolve();

export const isPushConfigured = () => Boolean(ONESIGNAL_APP_ID);

const isNative = () => {
  try {
    return Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};

function enqueueIdentityOp(fn) {
  identityQueue = identityQueue.then(fn).catch((err) => {
    console.warn('OneSignal identity operation failed:', err?.message || err);
  });
  return identityQueue;
}

function deferOneSignal(callback) {
  if (typeof window === 'undefined') return Promise.resolve();
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await callback(OneSignal);
      } finally {
        resolve();
      }
    });
  });
}

async function withNativeOneSignal(fn) {
  try {
    const mod = await import('onesignal-cordova-plugin');
    const OneSignal = mod.default || mod;
    await fn(OneSignal);
  } catch (err) {
    console.warn('OneSignal native call failed:', err?.message);
  }
}

async function linkWebUser(OneSignal, userId) {
  const uid = String(userId);
  const currentExternalId = OneSignal.User?.externalId ?? null;

  if (currentExternalId === uid && linkedExternalUserId === uid) {
    return;
  }

  if (currentExternalId && currentExternalId !== uid) {
    await OneSignal.logout();
    linkedExternalUserId = null;
  }

  if ((OneSignal.User?.externalId ?? null) === uid) {
    linkedExternalUserId = uid;
    return;
  }

  await OneSignal.login(uid);
  linkedExternalUserId = uid;
}

async function unlinkWebUser(OneSignal) {
  const currentExternalId = OneSignal.User?.externalId ?? null;
  if (!currentExternalId && !linkedExternalUserId) return;
  await OneSignal.logout();
  linkedExternalUserId = null;
}

// Native (Capacitor) push via the OneSignal Cordova plugin.
async function initNativePush() {
  try {
    const mod = await import('onesignal-cordova-plugin');
    const OneSignal = mod.default || mod;
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);
  } catch (err) {
    console.warn('OneSignal native init failed:', err?.message);
  }
}

// Initialise push on the current platform (web or native). No-op without app id.
export async function initWebPush() {
  if (initialised || !ONESIGNAL_APP_ID) return;
  if (typeof window === 'undefined') return;
  initialised = true;

  if (isNative()) {
    await initNativePush();
    return;
  }

  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    if (!document.getElementById('onesignal-sdk')) {
      const s = document.createElement('script');
      s.id = 'onesignal-sdk';
      s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      s.defer = true;
      document.head.appendChild(s);
    }
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      });
    });
  } catch (err) {
    console.warn('OneSignal web init failed:', err?.message);
  }
}

// Link the current device to the logged-in user (so we can target them).
export async function setExternalUserId(userId) {
  if (!ONESIGNAL_APP_ID || !userId || typeof window === 'undefined') return;

  const uid = String(userId);
  if (linkedExternalUserId === uid) return;

  if (isNative()) {
    return enqueueIdentityOp(async () => {
      await withNativeOneSignal(async (OneSignal) => {
        if (linkedExternalUserId && linkedExternalUserId !== uid) {
          await OneSignal.logout();
        }
        await OneSignal.login(uid);
        linkedExternalUserId = uid;
      });
    });
  }

  return enqueueIdentityOp(async () => {
    await deferOneSignal(async (OneSignal) => {
      await linkWebUser(OneSignal, uid);
    });
  });
}

export async function clearExternalUserId() {
  if (!ONESIGNAL_APP_ID || typeof window === 'undefined') return;
  linkedExternalUserId = null;

  if (isNative()) {
    return enqueueIdentityOp(() => withNativeOneSignal((OneSignal) => OneSignal.logout()));
  }

  return enqueueIdentityOp(() => deferOneSignal((OneSignal) => unlinkWebUser(OneSignal)));
}

// Send a push to a user (by auth id / external id) via the secure Edge Function.
export async function sendPushToUser(externalUserId, { title, message, url } = {}) {
  if (!externalUserId || !title) return { success: false, message: 'Missing target or title' };
  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { externalUserId, title, message, url },
    });
    if (!error && data?.ok) return { success: true };
    return {
      success: false,
      message: error?.message || data?.error || 'Push not sent (deploy send-push function & set ONESIGNAL_REST_API_KEY).',
    };
  } catch (err) {
    return { success: false, message: err?.message };
  }
}

const pushService = { isPushConfigured, initWebPush, setExternalUserId, clearExternalUserId, sendPushToUser };
export default pushService;
