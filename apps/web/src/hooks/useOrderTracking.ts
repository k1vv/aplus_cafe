import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface UseOrderTrackingOptions {
  orderId?: string;
  enabled?: boolean;
}

export function useOrderTracking({ orderId, enabled = true }: UseOrderTrackingOptions = {}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem('aplus_auth_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    const endpoint = orderId
      ? `${API_BASE_URL}/orders/${orderId}/track`
      : `${API_BASE_URL}/orders/track`;

    // Create EventSource with auth header via URL param workaround
    // Note: Standard EventSource doesn't support headers, so we use fetch + custom parsing
    const eventSource = new EventSource(`${endpoint}?token=${encodeURIComponent(token)}`);

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener('order-update', (event) => {
      try {
        const data = JSON.parse(event.data) as Order;
        if (orderId) {
          setOrder(data);
        } else {
          setOrders((prev) => {
            const index = prev.findIndex((o) => o.id === data.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data;
              return updated;
            }
            return [data, ...prev];
          });
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    });

    eventSource.onerror = (e) => {
      console.error('SSE error:', e);
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [orderId, enabled]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    order,
    orders,
    isConnected,
    error,
    reconnect: connect,
  };
}

// Hook for polling fallback (when SSE is not available)
export function useOrderPolling({ orderId, intervalMs = 5000 }: { orderId?: string; intervalMs?: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const token = localStorage.getItem('aplus_auth_token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (e) {
        console.error('Failed to fetch order:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, intervalMs);

    return () => clearInterval(interval);
  }, [orderId, intervalMs]);

  return { order, loading };
}
