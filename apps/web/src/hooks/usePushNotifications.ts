import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

      if (!isSupported) {
        setStatus((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      const permission = Notification.permission;

      // Check if already subscribed
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (e) {
        console.error('Failed to check subscription:', e);
      }

      setStatus({
        isSupported: true,
        permission,
        isSubscribed,
      });
    };

    checkSupport();
  }, []);

  // Request notification permission and subscribe
  const subscribe = useCallback(async () => {
    if (!status.isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setStatus((prev) => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return false;
      }

      // Get VAPID public key from server
      const { data: vapidData } = await api.get<{ publicKey: string }>('/notifications/vapid-public-key');
      if (!vapidData?.publicKey) {
        setError('Push notifications not configured');
        setLoading(false);
        return false;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      // Send subscription to server
      const subscriptionJson = subscription.toJSON();
      await api.post('/notifications/subscribe', {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
      });

      setStatus((prev) => ({ ...prev, isSubscribed: true }));
      setLoading(false);
      return true;
    } catch (e) {
      console.error('Failed to subscribe:', e);
      setError('Failed to enable push notifications');
      setLoading(false);
      return false;
    }
  }, [status.isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify server
        await api.post('/notifications/unsubscribe', {
          endpoint: subscription.endpoint,
        });
      }

      setStatus((prev) => ({ ...prev, isSubscribed: false }));
      setLoading(false);
      return true;
    } catch (e) {
      console.error('Failed to unsubscribe:', e);
      setError('Failed to disable push notifications');
      setLoading(false);
      return false;
    }
  }, []);

  return {
    ...status,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
