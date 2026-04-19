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
  // Handle 204 No Content or empty body
  if (response.status === 204) {
    return { data: undefined };
  }
  // Check if response has content before parsing JSON
  const text = await response.text();
  if (!text || text.length === 0) {
    return { data: undefined };
  }
  try {
    const data = JSON.parse(text);
    return { data };
  } catch {
    return { data: undefined };
  }
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

  patch: async <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
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

  downloadReceipt: async (id: string): Promise<{ error?: string }> => {
    try {
      const token = localStorage.getItem('aplus_auth_token');
      const response = await fetch(`${API_BASE_URL}/orders/${id}/receipt`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        return { error: 'Failed to download receipt' };
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-order-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return {};
    } catch {
      return { error: 'Failed to download receipt' };
    }
  },
};

// Checkout API endpoints
export const checkoutApi = {
  createCheckoutSession: (data: CreateCheckoutRequest) =>
    api.post<{ clientSecret: string }>('/checkout/create-session', data),
  confirmPayment: (sessionId: string) =>
    api.post<void>('/checkout/confirm', { sessionId }),
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
  phone?: string;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  deliveryAddress?: SavedDeliveryAddress;
}

export interface SavedDeliveryAddress {
  address: string;
  lat: number;
  lng: number;
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
  notes?: string;
  orderType?: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string;
  createdAt: string;
  orderItems: OrderItem[];
  customerName?: string;
  customerEmail?: string;
  assignedRiderId?: number;
  assignedRiderName?: string;
  deliveryStatus?: string;
}

export interface Rider {
  id: number;
  name: string;
  vehicleType: string;
  licensePlate: string;
  isAvailable: boolean;
  rating: number;
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

  // Delivery address with coordinates
  saveDeliveryAddress: (data: SaveDeliveryAddressRequest) =>
    api.put<User>('/users/delivery-address', data),

  getDeliveryAddress: () =>
    api.get<SavedDeliveryAddress>('/users/delivery-address'),
};

export interface SaveDeliveryAddressRequest {
  address: string;
  lat: number;
  lng: number;
}

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

// Analytics types
export interface AnalyticsResponse {
  overview: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;
    pendingOrders: number;
    activeDeliveries: number;
  };
  revenueChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  popularItems: {
    id: number;
    name: string;
    imageUrl: string;
    orderCount: number;
    revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  recentOrders: {
    id: number;
    customerName: string;
    total: number;
    status: string;
    orderType: string;
    createdAt: string;
    itemCount: number;
  }[];
}

// Admin API endpoints
export const adminApi = {
  // Analytics
  getAnalytics: () => api.get<AnalyticsResponse>('/admin/analytics'),

  // Menu management
  getMenuItems: () => api.get<MenuItemResponse[]>('/admin/menu'),
  createMenuItem: (data: CreateMenuItemRequest) => api.post<MenuItemResponse>('/admin/menu', data),
  updateMenuItem: (id: number, data: CreateMenuItemRequest) => api.put<MenuItemResponse>(`/admin/menu/${id}`, data),
  deleteMenuItem: (id: number) => api.delete(`/admin/menu/${id}`),

  // Orders management
  getAllOrders: () => api.get<Order[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: string, cancellationReason?: string) =>
    api.patch(`/admin/orders/${id}/status`, { status, cancellationReason }),

  // Rider management
  getRiders: () => api.get<Rider[]>('/admin/riders'),
  assignRider: (orderId: string, riderId: number) =>
    api.post(`/admin/orders/${orderId}/assign-rider`, { riderId }),
  unassignRider: (orderId: string) =>
    api.delete(`/admin/orders/${orderId}/assign-rider`),

  // Reservations management
  getAllReservations: (date?: string) =>
    api.get<Reservation[]>(`/admin/reservations${date ? `?date=${date}` : ''}`),
  updateReservationStatus: (id: string, status: string) =>
    api.patch(`/admin/reservations/${id}/status`, { status }),

  // Users management
  getAllUsers: () => api.get<AdminUser[]>('/admin/users'),
  toggleUserActive: (id: string, active: boolean) =>
    api.patch(`/admin/users/${id}/active`, { active }),
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

// Promo Code types
export interface PromoValidationResponse {
  valid: boolean;
  code?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  errorMessage?: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}

// Promo API endpoints
export const promoApi = {
  validate: (code: string, subtotal: number) =>
    api.post<PromoValidationResponse>('/promo/validate', { code, subtotal }),
};

// Favorites API endpoints
export const favoritesApi = {
  getFavorites: () => api.get<MenuItemResponse[]>('/users/favorites'),
  getFavoriteIds: () => api.get<number[]>('/users/favorites/ids'),
  toggleFavorite: (menuId: number) =>
    api.post<{ isFavorite: boolean }>(`/users/favorites/${menuId}`),
};

// Review types
export interface Review {
  id: number;
  orderId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  adminResponse?: string;
  adminRespondedAt?: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

// Reviews API endpoints
export const reviewsApi = {
  getMyReviews: () => api.get<Review[]>('/users/reviews'),
  getOrderReview: (orderId: string) => api.get<Review>(`/users/orders/${orderId}/review`),
  canReview: (orderId: string) => api.get<{ canReview: boolean }>(`/users/orders/${orderId}/can-review`),
  createReview: (orderId: number, rating: number, comment?: string) =>
    api.post<Review>('/users/reviews', { orderId, rating, comment }),
};

// Announcement types
export interface Announcement {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

// Admin Reviews and Announcements API
export const adminReviewsApi = {
  getAllReviews: () => api.get<Review[]>('/admin/reviews'),
  getReviewStats: () => api.get<ReviewStats>('/admin/reviews/stats'),
  respondToReview: (id: number, response: string) =>
    api.post<Review>(`/admin/reviews/${id}/respond`, { response }),
};

export const adminAnnouncementsApi = {
  getAll: () => api.get<Announcement[]>('/admin/announcements'),
  create: (data: Omit<Announcement, 'id' | 'createdAt' | 'isActive'>) =>
    api.post<Announcement>('/admin/announcements', data),
  update: (id: number, data: Partial<Announcement>) =>
    api.put<Announcement>(`/admin/announcements/${id}`, data),
  delete: (id: number) => api.delete(`/admin/announcements/${id}`),
};

// Admin Auth types and API
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
}

export interface AdminAuthResponse {
  accessToken: string;
  admin: AdminUser;
}

export const adminAuthApi = {
  login: (usernameOrEmail: string, password: string) =>
    api.post<AdminAuthResponse>('/admin/auth/login', { usernameOrEmail, password }),

  getMe: () => api.get<AdminUser>('/admin/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/admin/auth/change-password', { currentPassword, newPassword }),
};
