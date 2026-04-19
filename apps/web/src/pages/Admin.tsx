import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, LayoutDashboard, UtensilsCrossed, Package, CalendarDays, Users,
  Plus, Edit2, Trash2, Check, X, ChevronDown, RefreshCw, TrendingUp, Clock, Truck, DollarSign,
  Star, MessageSquare, Megaphone, Send, LogOut, Upload, ImageIcon, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MenuItemResponse, Order, Reservation, AdminUser,
  CategoryResponse, CreateMenuItemRequest, AnalyticsResponse, Review, ReviewStats,
  Announcement, Rider, ClosedDate, RecurringClosure, adminApi
} from "@/lib/api";
import { format } from "date-fns";
import LoadingOverlay from "@/components/LoadingOverlay";
import {
  useAnalytics,
  useAdminOrders, useUpdateOrderStatus, useAssignRider, useUnassignRider, useRiders,
  useAdminMenu, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useAdminReservations, useUpdateReservationStatus,
  useAdminUsers, useCreateRider, useDeleteUser,
  useAdminReviews, useRespondToReview,
  useAdminAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from "@/hooks/useAdminData";
import { imageApi } from "@/lib/api";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Orders", icon: Package },
  { path: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { path: "/admin/schedule", label: "Schedule", icon: Calendar },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

function AdminNav() {
  const location = useLocation();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardOverview() {
  const { data: analytics, isLoading: loading } = useAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load analytics</div>;
  }

  const { overview, revenueChart, popularItems, ordersByStatus, recentOrders } = analytics;

  return (
    <div className="space-y-6">
      <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Dashboard Overview</h2>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's Revenue</span>
          </div>
          <span className="text-2xl font-bold">RM {Number(overview.todayRevenue).toFixed(2)}</span>
          <div className="text-xs text-muted-foreground mt-1">{overview.todayOrders} orders</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">This Week</span>
          </div>
          <span className="text-2xl font-bold">RM {Number(overview.weekRevenue).toFixed(2)}</span>
          <div className="text-xs text-muted-foreground mt-1">{overview.weekOrders} orders</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Pending</span>
          </div>
          <span className="text-2xl font-bold">{overview.pendingOrders}</span>
          <div className="text-xs text-muted-foreground mt-1">awaiting action</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Deliveries</span>
          </div>
          <span className="text-2xl font-bold">{overview.activeDeliveries}</span>
          <div className="text-xs text-muted-foreground mt-1">in progress</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-bold mb-4">Revenue (Last 7 Days)</h3>
        <div className="flex items-end gap-1 h-32">
          {revenueChart.map((point, idx) => {
            const maxRevenue = Math.max(...revenueChart.map(p => Number(p.revenue)), 1);
            const height = (Number(point.revenue) / maxRevenue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`RM ${Number(point.revenue).toFixed(2)} (${point.orders} orders)`}
                />
                <span className="text-[9px] text-muted-foreground">{point.date.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-bold mb-4">Popular Items (30 Days)</h3>
          {popularItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {popularItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.orderCount} orders</div>
                  </div>
                  <span className="text-sm font-bold text-primary">RM {Number(item.revenue).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-bold mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">No orders yet</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.itemCount} items • {order.orderType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">RM {Number(order.total).toFixed(2)}</div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-bold mb-4">Order Status Distribution</h3>
        <div className="flex flex-wrap gap-3">
          {ordersByStatus.filter(s => s.count > 0).map((stat) => (
            <div key={stat.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <span className="text-xs capitalize">{stat.status}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {stat.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuManagement() {
  const { data: menuData, isLoading: loading } = useAdminMenu();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const items = menuData?.items || [];
  const categories = menuData?.categories || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CreateMenuItemRequest>({
    categoryId: 1,
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    isAvailable: true,
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);

    let finalImageUrl = formData.imageUrl;

    // Upload image if a new file was selected
    if (selectedFile) {
      const { data, error } = await imageApi.upload(selectedFile);
      if (error) {
        toast.error(error);
        setUploading(false);
        return;
      }
      if (data?.url) {
        finalImageUrl = data.url;
      }
    }

    const submitData = { ...formData, imageUrl: finalImageUrl };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData }, {
        onSuccess: () => {
          resetForm();
          setUploading(false);
        },
        onError: () => setUploading(false),
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          resetForm();
          setUploading(false);
        },
        onError: () => setUploading(false),
      });
    }
  };

  const handleDelete = async (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (item: MenuItemResponse) => {
    setEditingId(item.id);
    setFormData({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setFormData({ categoryId: 1, name: "", description: "", price: 0, imageUrl: "", isAvailable: true });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Menu Management</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="text-sm font-bold">{editingId ? "Edit Item" : "New Item"}</h3>
          <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} maxLength={255} />
          <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} maxLength={1000} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} min={0} max={99999} step={0.01} />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Image Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            {previewUrl || formData.imageUrl ? (
              <div className="flex items-center gap-3">
                <img src={previewUrl || formData.imageUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedFile ? selectedFile.name : formData.imageUrl}
                  </p>
                  <p className="text-xs text-primary">Click or drag to replace</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop an image or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} />
            Available
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={uploading}>{editingId ? "Update" : "Create"}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
              <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{item.name}</span>
                  {!item.isAvailable && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">Unavailable</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.categoryName} • RM {item.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersManagement() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: loading } = useAdminOrders();
  const { data: riders = [] } = useRiders();
  const updateStatusMutation = useUpdateOrderStatus();
  const assignRiderMutation = useAssignRider();
  const unassignRiderMutation = useUnassignRider();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const handleAssignRider = async (orderId: string, riderId: number) => {
    assignRiderMutation.mutate({ orderId, riderId });
  };

  const handleUnassignRider = async (orderId: string) => {
    unassignRiderMutation.mutate(orderId);
  };

  const handleStatusUpdate = async (id: string, status: string, e: React.MouseEvent, reason?: string) => {
    e.stopPropagation();

    // If cancelling, show modal first
    if (status === 'CANCELLED') {
      const order = orders.find(o => o.id === id);
      if (order && !reason) {
        setCancelModalOrder(order);
        return;
      }
    }

    updateStatusMutation.mutate({ id, status, reason });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModalOrder || !cancellationReason.trim()) {
      return;
    }

    updateStatusMutation.mutate(
      { id: cancelModalOrder.id, status: 'CANCELLED', reason: cancellationReason.trim() },
      {
        onSuccess: () => {
          setCancelModalOrder(null);
          setCancellationReason("");
        },
      }
    );
  };

  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  // Status progression order (without CANCELLED - that's handled separately)
  const statusProgression = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];

  const getNextStatus = (currentStatus: string): string | null => {
    const currentIndex = statusProgression.indexOf(currentStatus?.toUpperCase());
    if (currentIndex === -1 || currentIndex >= statusProgression.length - 1) {
      return null;
    }
    return statusProgression[currentIndex + 1];
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: "Confirm Order",
      CONFIRMED: "Start Preparing",
      PREPARING: "Mark Ready",
      READY_FOR_PICKUP: "Out for Delivery",
      OUT_FOR_DELIVERY: "Mark Delivered",
    };
    return labels[status] || status.replace(/_/g, " ");
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'DELIVERED': return 'bg-green-500/10 text-green-500';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive';
      case 'PREPARING': return 'bg-orange-500/10 text-orange-500';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/10 text-blue-500';
      case 'READY_FOR_PICKUP': return 'bg-purple-500/10 text-purple-500';
      case 'CONFIRMED': return 'bg-primary/10 text-primary';
      default: return 'bg-yellow-500/10 text-yellow-500';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Orders Management</h2>
        <Button variant="outline" size="sm" onClick={refreshOrders}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div
                key={order.id}
                className={`rounded-xl border bg-card overflow-hidden transition-all ${
                  isExpanded ? 'border-primary' : 'border-border'
                }`}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">Order #{order.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          order.orderType === 'DELIVERY' ? 'bg-blue-500/10 text-blue-500' :
                          order.orderType === 'PICKUP' ? 'bg-green-500/10 text-green-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {order.orderType || 'DINE_IN'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      {order.customerName && (
                        <div className="text-sm text-foreground">{order.customerName}</div>
                      )}
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                        {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">RM {Number(order.grandTotal || order.totalAmount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {order.orderItems?.map((item) => `${item.quantity}× ${item.itemName || (item as any).menuName}`).join(", ") || 'No items'}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer Info</h4>
                      <div className="bg-background rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{order.customerName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{order.customerEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Order Items</h4>
                      <div className="bg-background rounded-lg p-3 space-y-2">
                        {order.orderItems?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}× {item.itemName || (item as any).menuName}</span>
                            <span className="font-bold text-primary">RM {(Number(item.itemPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 mt-2 space-y-1 text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                          <div className="flex justify-between"><span>Subtotal</span><span>RM {Number(order.totalAmount - order.serviceCharge - order.deliveryFee).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span>Service (6%)</span><span>RM {Number(order.serviceCharge).toFixed(2)}</span></div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between"><span>Delivery</span><span>RM {Number(order.deliveryFee).toFixed(2)}</span></div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1">
                            <span>Total</span><span>RM {Number(order.grandTotal || order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-sm text-foreground italic">"{order.notes}"</p>
                        </div>
                      </div>
                    )}

                    {/* Rider Assignment - Only for delivery orders when READY_FOR_PICKUP */}
                    {order.orderType === 'DELIVERY' && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          <Truck className="inline h-3 w-3 mr-1" />
                          Rider Assignment
                        </h4>
                        <div className="bg-background rounded-lg p-3">
                          {order.assignedRiderId ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{order.assignedRiderName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Status: <span className={`font-medium ${
                                    order.deliveryStatus === 'IN_TRANSIT' ? 'text-green-500' :
                                    order.deliveryStatus === 'ASSIGNED' ? 'text-blue-500' :
                                    order.deliveryStatus === 'DELIVERED' ? 'text-primary' :
                                    'text-muted-foreground'
                                  }`}>{order.deliveryStatus?.replace(/_/g, ' ')}</span>
                                </p>
                              </div>
                              {order.status?.toUpperCase() === 'READY_FOR_PICKUP' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnassignRider(order.id)}
                                  disabled={assignRiderMutation.isPending || unassignRiderMutation.isPending}
                                >
                                  {unassignRiderMutation.isPending ? (
                                    <span className="h-3 w-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    'Unassign'
                                  )}
                                </Button>
                              )}
                            </div>
                          ) : order.status?.toUpperCase() === 'READY_FOR_PICKUP' ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground mb-2">Assign a rider before marking as out for delivery</p>
                              <select
                                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignRider(order.id, parseInt(e.target.value));
                                  }
                                }}
                                disabled={assignRiderMutation.isPending || unassignRiderMutation.isPending}
                              >
                                <option value="">Select a rider...</option>
                                {riders.filter(r => r.isAvailable).map(rider => (
                                  <option key={rider.id} value={rider.id}>
                                    {rider.name} - {rider.vehicleType} ({rider.licensePlate})
                                  </option>
                                ))}
                              </select>
                              {riders.filter(r => r.isAvailable).length === 0 && (
                                <p className="text-xs text-destructive">No available riders</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Rider can be assigned when order is ready for pickup
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Timeline</h4>
                      <div className="bg-background rounded-lg p-3 space-y-1 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}</span>
                        </div>
                        {order.confirmedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confirmed:</span>
                            <span>{format(new Date(order.confirmedAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                        {order.preparingAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Preparing:</span>
                            <span>{format(new Date(order.preparingAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                        {order.readyAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ready:</span>
                            <span>{format(new Date(order.readyAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                        {order.outForDeliveryAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Out for Delivery:</span>
                            <span>{format(new Date(order.outForDeliveryAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                        {order.deliveredAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivered:</span>
                            <span>{format(new Date(order.deliveredAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                        {order.cancelledAt && (
                          <div className="flex justify-between text-destructive">
                            <span>Cancelled:</span>
                            <span>{format(new Date(order.cancelledAt), "dd MMM yyyy, h:mm a")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    {order.cancellationReason && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-2">Cancellation Reason</h4>
                        <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                          <p className="text-sm text-destructive">{order.cancellationReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    {order.status?.toUpperCase() !== 'DELIVERED' && order.status?.toUpperCase() !== 'CANCELLED' && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Actions</h4>
                        <div className="flex flex-col gap-2">
                          {/* Next Status Button */}
                          {(() => {
                            const nextStatus = getNextStatus(order.status);
                            const currentStatus = order.status?.toUpperCase();

                            // For delivery orders at READY_FOR_PICKUP, require rider assignment first
                            if (currentStatus === 'READY_FOR_PICKUP' && order.orderType === 'DELIVERY' && !order.assignedRiderId) {
                              return (
                                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                  <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                                    Assign a rider above before marking as out for delivery
                                  </p>
                                </div>
                              );
                            }

                            if (nextStatus) {
                              return (
                                <Button
                                  onClick={(e) => handleStatusUpdate(order.id, nextStatus, e)}
                                  className="w-full text-xs font-bold uppercase tracking-wider"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  {getStatusLabel(currentStatus || '')}
                                </Button>
                              );
                            }
                            return null;
                          })()}

                          {/* Cancel Button */}
                          <Button
                            variant="outline"
                            onClick={(e) => handleStatusUpdate(order.id, 'CANCELLED', e)}
                            className="w-full text-xs font-bold uppercase tracking-wider text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Completed/Cancelled Status */}
                    {(order.status?.toUpperCase() === 'DELIVERED' || order.status?.toUpperCase() === 'CANCELLED') && (
                      <div className={`rounded-lg p-3 ${
                        order.status?.toUpperCase() === 'DELIVERED'
                          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                          : 'bg-destructive/5 border border-destructive/20'
                      }`}>
                        <p className={`text-sm font-medium ${
                          order.status?.toUpperCase() === 'DELIVERED'
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-destructive'
                        }`}>
                          {order.status?.toUpperCase() === 'DELIVERED' ? 'Order Completed' : 'Order Cancelled'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Cancel Order #{cancelModalOrder.id}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for cancelling this order. This will be visible to the customer.
            </p>
            <Textarea
              placeholder="Enter cancellation reason..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              className="mb-4"
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOrder(null);
                  setCancellationReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelConfirm}
                disabled={!cancellationReason.trim()}
              >
                <X className="h-4 w-4 mr-1" />
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReservationsManagement() {
  const [dateFilter, setDateFilter] = useState("");
  const { data: reservations = [], isLoading: loading } = useAdminReservations(dateFilter || undefined);
  const updateStatusMutation = useUpdateReservationStatus();

  const handleStatusUpdate = async (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Reservations</h2>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No reservations found</div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => (
            <div key={res.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold">{res.customerName}</div>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {format(new Date(res.reservationDate), "dd MMM yyyy")} at {formatTime(res.startTime)}
                  </span>
                </div>
                <select
                  className="text-xs px-2 py-1 rounded border border-border bg-background"
                  value={res.status}
                  onChange={(e) => handleStatusUpdate(res.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-muted-foreground">
                {res.partySize} guests • {res.customerPhone}
              </div>
              {res.specialRequests && (
                <div className="mt-2 text-xs text-muted-foreground italic">"{res.specialRequests}"</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersManagement() {
  const { data: users = [], isLoading: loading } = useAdminUsers();
  const createRiderMutation = useCreateRider();
  const deleteUserMutation = useDeleteUser();
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [riderForm, setRiderForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    vehicleType: "Motorcycle",
    licensePlate: "",
  });

  const handleCreateRider = async () => {
    if (!riderForm.email || !riderForm.password || !riderForm.fullName || !riderForm.licensePlate) {
      return;
    }
    createRiderMutation.mutate(riderForm, {
      onSuccess: () => {
        setShowRiderForm(false);
        setRiderForm({ email: "", password: "", fullName: "", phone: "", vehicleType: "Motorcycle", licensePlate: "" });
      },
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500/10 text-purple-500';
      case 'RIDER': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Users Management</h2>
        <Button size="sm" onClick={() => setShowRiderForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Rider
        </Button>
      </div>

      {/* Create Rider Form */}
      {showRiderForm && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="text-sm font-bold">Create New Rider</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Full Name *"
              value={riderForm.fullName}
              onChange={(e) => setRiderForm({ ...riderForm, fullName: e.target.value })}
              maxLength={100}
            />
            <Input
              placeholder="Email *"
              type="email"
              value={riderForm.email}
              onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Password *"
              type="password"
              value={riderForm.password}
              onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
              maxLength={100}
            />
            <Input
              placeholder="Phone"
              value={riderForm.phone}
              onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={riderForm.vehicleType}
              onChange={(e) => setRiderForm({ ...riderForm, vehicleType: e.target.value })}
            >
              <option value="Motorcycle">Motorcycle</option>
              <option value="E-Bike">E-Bike</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Car">Car</option>
            </select>
            <Input
              placeholder="License Plate *"
              value={riderForm.licensePlate}
              onChange={(e) => setRiderForm({ ...riderForm, licensePlate: e.target.value })}
              maxLength={20}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowRiderForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateRider} disabled={createRiderMutation.isPending}>
              {createRiderMutation.isPending ? "Creating..." : "Create Rider"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{user.fullName || "No name"}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    user.emailVerified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              {user.role !== 'ADMIN' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(user.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Delete User
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteUserMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsManagement() {
  const queryClient = useQueryClient();
  const { data: reviewData, isLoading: loading } = useAdminReviews();
  const respondMutation = useRespondToReview();
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const reviews = reviewData?.reviews || [];
  const stats = reviewData?.stats || null;

  const handleRespond = async (reviewId: number) => {
    if (!responseText.trim()) {
      return;
    }
    respondMutation.mutate(
      { reviewId, response: responseText },
      {
        onSuccess: () => {
          setRespondingTo(null);
          setResponseText("");
        },
      }
    );
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
      />
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Reviews Management</h2>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Avg Rating</span>
            </div>
            <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
            <div className="flex mt-1">{renderStars(Math.round(stats.averageRating))}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Reviews</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalReviews}</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card col-span-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Rating Distribution</div>
            <div className="space-y-1">
              {[
                { stars: 5, count: stats.fiveStarCount },
                { stars: 4, count: stats.fourStarCount },
                { stars: 3, count: stats.threeStarCount },
                { stars: 2, count: stats.twoStarCount },
                { stars: 1, count: stats.oneStarCount },
              ].map(({ stars, count }) => {
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-8">{stars}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No reviews found</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{review.userName}</span>
                    <span className="text-xs text-muted-foreground">Order #{review.orderId}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {format(new Date(review.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2 italic">"{review.comment}"</p>
              )}

              {review.adminResponse ? (
                <div className="mt-3 pl-3 border-l-2 border-primary">
                  <p className="text-xs font-bold text-primary mb-1">Admin Response:</p>
                  <p className="text-xs text-muted-foreground">{review.adminResponse}</p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Write your response..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={2}
                    className="text-sm"
                    maxLength={1000}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleRespond(review.id)}>
                      <Send className="h-3 w-3 mr-1" /> Send Response
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setRespondingTo(review.id)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" /> Respond
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementsManagement() {
  const { data: announcements = [], isLoading: loading } = useAdminAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, {
        onSuccess: () => resetForm(),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => resetForm(),
      });
    }
  };

  const handleDelete = async (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      imageUrl: announcement.imageUrl || "",
      startDate: announcement.startDate ? announcement.startDate.substring(0, 16) : "",
      endDate: announcement.endDate ? announcement.endDate.substring(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleToggleActive = async (announcement: Announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      data: { isActive: !announcement.isActive },
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", content: "", imageUrl: "", startDate: "", endDate: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Announcements</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="text-sm font-bold">{editingId ? "Edit Announcement" : "New Announcement"}</h3>
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            maxLength={255}
          />
          <Textarea
            placeholder="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
            maxLength={2000}
          />
          <Input
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            maxLength={500}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date (optional)</label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date (optional)</label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No announcements found</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{announcement.title}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      announcement.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                  {(announcement.startDate || announcement.endDate) && (
                    <div className="text-[10px] text-muted-foreground mt-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {announcement.startDate && `From: ${format(new Date(announcement.startDate), "dd MMM yyyy, h:mm a")}`}
                      {announcement.startDate && announcement.endDate && " — "}
                      {announcement.endDate && `Until: ${format(new Date(announcement.endDate), "dd MMM yyyy, h:mm a")}`}
                    </div>
                  )}
                </div>
                {announcement.imageUrl && (
                  <img src={announcement.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover ml-4" />
                )}
              </div>
              <div className="flex gap-1 mt-3">
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(announcement)}>
                  {announcement.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScheduleManagement() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [recurringClosures, setRecurringClosures] = useState<RecurringClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClosedDate, setNewClosedDate] = useState('');
  const [newClosedReason, setNewClosedReason] = useState('');
  const [newRecurringDay, setNewRecurringDay] = useState<number | ''>('');
  const [newRecurringReason, setNewRecurringReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [closedRes, recurringRes] = await Promise.all([
        adminApi.getClosedDates(),
        adminApi.getRecurringClosures(),
      ]);
      if (closedRes.data) setClosedDates(closedRes.data);
      if (recurringRes.data) setRecurringClosures(recurringRes.data);
    } catch (error) {
      toast.error('Failed to load schedule data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClosedDate = async () => {
    if (!newClosedDate) {
      toast.error('Please select a date');
      return;
    }
    const { data, error } = await adminApi.addClosedDate(newClosedDate, newClosedReason || undefined);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setClosedDates([...closedDates, data]);
      setNewClosedDate('');
      setNewClosedReason('');
      toast.success('Closed date added');
    }
  };

  const handleDeleteClosedDate = async (id: number) => {
    const { error } = await adminApi.deleteClosedDate(id);
    if (error) {
      toast.error(error);
      return;
    }
    setClosedDates(closedDates.filter(d => d.id !== id));
    toast.success('Closed date removed');
  };

  const handleAddRecurringClosure = async () => {
    if (newRecurringDay === '') {
      toast.error('Please select a day');
      return;
    }
    const { data, error } = await adminApi.addRecurringClosure(newRecurringDay, newRecurringReason || undefined);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setRecurringClosures([...recurringClosures, data]);
      setNewRecurringDay('');
      setNewRecurringReason('');
      toast.success('Recurring closure added');
    }
  };

  const handleDeleteRecurringClosure = async (id: number) => {
    const { error } = await adminApi.deleteRecurringClosure(id);
    if (error) {
      toast.error(error);
      return;
    }
    setRecurringClosures(recurringClosures.filter(r => r.id !== id));
    toast.success('Recurring closure removed');
  };

  const handleToggleRecurringClosure = async (id: number) => {
    const { data, error } = await adminApi.toggleRecurringClosure(id);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setRecurringClosures(recurringClosures.map(r => r.id === id ? data : r));
      toast.success(data.isActive ? 'Closure activated' : 'Closure deactivated');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Schedule Management</h2>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Recurring Closures Section */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-bold mb-4">Recurring Closures</h3>
        <p className="text-xs text-muted-foreground mb-4">Set days when the cafe is regularly closed (e.g., every Sunday)</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            value={newRecurringDay}
            onChange={(e) => setNewRecurringDay(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select day...</option>
            {DAY_NAMES.map((day, idx) => (
              <option key={idx} value={idx}>{day}</option>
            ))}
          </select>
          <Input
            placeholder="Reason (optional)"
            value={newRecurringReason}
            onChange={(e) => setNewRecurringReason(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddRecurringClosure} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        {recurringClosures.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recurring closures set</p>
        ) : (
          <div className="space-y-2">
            {recurringClosures.map((closure) => (
              <div
                key={closure.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  closure.isActive ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRecurringClosure(closure.id)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      closure.isActive ? 'bg-destructive' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        closure.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="font-medium">{DAY_NAMES[closure.dayOfWeek]}</span>
                    {closure.reason && (
                      <span className="text-xs text-muted-foreground ml-2">({closure.reason})</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteRecurringClosure(closure.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specific Closed Dates Section */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-bold mb-4">Specific Closed Dates</h3>
        <p className="text-xs text-muted-foreground mb-4">Mark specific dates when the cafe will be closed (holidays, maintenance, etc.)</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1"
          />
          <Input
            placeholder="Reason (optional)"
            value={newClosedReason}
            onChange={(e) => setNewClosedReason(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddClosedDate} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        {closedDates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No specific closed dates set</p>
        ) : (
          <div className="space-y-2">
            {closedDates.map((closedDate) => (
              <div
                key={closedDate.id}
                className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5"
              >
                <div>
                  <span className="font-medium">
                    {format(new Date(closedDate.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  {closedDate.reason && (
                    <span className="text-xs text-muted-foreground ml-2">({closedDate.reason})</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteClosedDate(closedDate.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link to="/admin" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              APlus Admin
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:inline text-xs font-medium opacity-80">
                {user.fullName}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav />

        <div className="mt-6">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/reservations" element={<ReservationsManagement />} />
            <Route path="/schedule" element={<ScheduleManagement />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/reviews" element={<ReviewsManagement />} />
            <Route path="/announcements" element={<AnnouncementsManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
