const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const TOKEN_KEY = "aplus_auth_token";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.text();
    return { error: error || response.statusText };
  }
  const data = await response.json();
  return { data };
}

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },
};

// Auth response type
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

// Two-factor setup response
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeDataUri: string;
  manualEntryKey: string;
}

// Auth API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, fullName }),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get<User>('/auth/me'),

  // Email verification
  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),

  resendVerificationEmail: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }),

  // Two-factor authentication
  setupTwoFactor: () =>
    api.get<TwoFactorSetupResponse>('/auth/2fa/setup'),

  enableTwoFactor: (secret: string, code: string) =>
    api.post<{ message: string }>('/auth/2fa/enable', { secret, code }),

  disableTwoFactor: (code: string) =>
    api.post<{ message: string }>('/auth/2fa/disable', { code }),

  verifyTwoFactor: (twoFactorToken: string, code: string) =>
    api.post<AuthResponse>('/auth/2fa/verify', { twoFactorToken, code }),

  // Password reset
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),
};

// Orders API endpoints
export const ordersApi = {
  getOrders: () => api.get<Order[]>('/orders'),

  getOrder: (id: string) => api.get<Order>(`/orders/${id}`),

  createOrder: (orderData: CreateOrderRequest) =>
    api.post<Order>('/orders', orderData),

  cancelOrder: (id: string) =>
    api.put<Order>(`/orders/${id}/cancel`, {}),
};

// Checkout API endpoints
export const checkoutApi = {
  createCheckoutSession: (data: CreateCheckoutRequest) =>
    api.post<{ clientSecret: string }>('/checkout/create-session', data),
};

// Menu API endpoints
export const menuApi = {
  getMenuItems: () => api.get<MenuItemResponse[]>('/menu'),

  getMenuItem: (id: number) => api.get<MenuItemResponse>(`/menu/${id}`),

  getMenuItemsByCategory: (categoryId: number) =>
    api.get<MenuItemResponse[]>(`/menu/category/${categoryId}`),

  getCategories: () => api.get<CategoryResponse[]>('/categories'),
};

// Types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface MenuItemResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

export interface OrderItem {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  grandTotal: number;
  totalAmount: number;
  serviceCharge: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  confirmedAt: string | null;
  preparingAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  orderItems: OrderItem[];
}

export interface CreateOrderRequest {
  items: Array<{ name: string; price: number; quantity: number }>;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  deliveryDetails?: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  pickupDetails?: {
    name: string;
    phone: string;
    pickupTime?: string;
  };
  dineInDetails?: {
    tableNumber?: string;
    partySize?: number;
  };
}

export interface CreateCheckoutRequest {
  items: Array<{ name: string; price: number; quantity: number }>;
  customerEmail?: string;
  userId?: string;
  deliveryDetails: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  returnUrl: string;
}

// Reservations API endpoints
export const reservationsApi = {
  getReservations: () => api.get<Reservation[]>('/reservations'),

  getReservation: (id: string) => api.get<Reservation>(`/reservations/${id}`),

  createReservation: (data: CreateReservationRequest) =>
    api.post<Reservation>('/reservations', data),

  cancelReservation: (id: string) => api.delete(`/reservations/${id}`),
};

export interface Reservation {
  id: string;
  userId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  specialRequests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt: string;
}

export interface CreateReservationRequest {
  reservationDate: string;
  startTime: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  specialRequests?: string;
}

// User Profile API endpoints
export const userApi = {
  getProfile: () => api.get<UserProfile>('/users/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<UserProfile>('/users/profile', data),

  getAddresses: () => api.get<Address[]>('/users/addresses'),

  addAddress: (data: CreateAddressRequest) =>
    api.post<Address>('/users/addresses', data),

  updateAddress: (id: string, data: CreateAddressRequest) =>
    api.put<Address>(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
};

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

// Admin API endpoints
export const adminApi = {
  // Menu management
  getMenuItems: () => api.get<MenuItemResponse[]>('/admin/menu'),
  createMenuItem: (data: CreateMenuItemRequest) => api.post<MenuItemResponse>('/admin/menu', data),
  updateMenuItem: (id: number, data: CreateMenuItemRequest) => api.put<MenuItemResponse>(`/admin/menu/${id}`, data),
  deleteMenuItem: (id: number) => api.delete(`/admin/menu/${id}`),

  // Orders management
  getAllOrders: () => api.get<Order[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),

  // Reservations management
  getAllReservations: (date?: string) =>
    api.get<Reservation[]>(`/admin/reservations${date ? `?date=${date}` : ''}`),
  updateReservationStatus: (id: string, status: string) =>
    api.put(`/admin/reservations/${id}/status`, { status }),

  // Users management
  getAllUsers: () => api.get<AdminUser[]>('/admin/users'),
  toggleUserActive: (id: string, active: boolean) =>
    api.put(`/admin/users/${id}/active`, { active }),
};

export interface CreateMenuItemRequest {
  categoryId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}
