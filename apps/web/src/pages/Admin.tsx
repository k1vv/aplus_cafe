import { useState, useEffect } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, LayoutDashboard, UtensilsCrossed, Package, CalendarDays, Users,
  Plus, Edit2, Trash2, Check, X, ChevronDown, RefreshCw, TrendingUp, Clock, Truck, DollarSign,
  Star, MessageSquare, Megaphone, Send, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi, menuApi, MenuItemResponse, Order, Reservation, AdminUser,
  CategoryResponse, CreateMenuItemRequest, AnalyticsResponse, Review, ReviewStats,
  Announcement, adminReviewsApi, adminAnnouncementsApi
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Orders", icon: Package },
  { path: "/admin/reservations", label: "Reservations", icon: CalendarDays },
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
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data } = await adminApi.getAnalytics();
      if (data) setAnalytics(data);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

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
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateMenuItemRequest>({
    categoryId: 1,
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    isAvailable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [menuRes, catRes] = await Promise.all([
      menuApi.getMenuItems(),
      menuApi.getCategories(),
    ]);
    if (menuRes.data) setItems(menuRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (editingId) {
      const { error } = await adminApi.updateMenuItem(editingId, formData);
      if (error) {
        toast.error("Failed to update item");
        return;
      }
      toast.success("Item updated");
    } else {
      const { error } = await adminApi.createMenuItem(formData);
      if (error) {
        toast.error("Failed to create item");
        return;
      }
      toast.success("Item created");
    }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    const { error } = await adminApi.deleteMenuItem(id);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    toast.success("Item deleted");
    fetchData();
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
          <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
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
          <Input placeholder="Image URL" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} />
            Available
          </label>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await adminApi.getAllOrders();
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await adminApi.updateOrderStatus(id, status);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success("Status updated");
    fetchOrders();
  };

  const statuses = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

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
        <Button variant="outline" size="sm" onClick={fetchOrders}>
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
                      </div>
                    </div>

                    {/* Update Status */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={(e) => handleStatusUpdate(order.id, s, e)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                              order.status?.toUpperCase() === s
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-border hover:bg-muted'
                            }`}
                          >
                            {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReservationsManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchReservations();
  }, [dateFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    const { data } = await adminApi.getAllReservations(dateFilter || undefined);
    if (data) setReservations(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await adminApi.updateReservationStatus(id, status);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success("Status updated");
    fetchReservations();
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await adminApi.getAllUsers();
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const { error } = await adminApi.toggleUserActive(id, active);
    if (error) {
      toast.error("Failed to update user");
      return;
    }
    toast.success(active ? "User activated" : "User deactivated");
    fetchUsers();
  };

  return (
    <div>
      <h2 className="text-xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>Users Management</h2>

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
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">Inactive</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(user.id, !user.isActive)}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reviewsRes, statsRes] = await Promise.all([
      adminReviewsApi.getAllReviews(),
      adminReviewsApi.getReviewStats(),
    ]);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    if (statsRes.data) setStats(statsRes.data);
    setLoading(false);
  };

  const handleRespond = async (reviewId: number) => {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }
    const { error } = await adminReviewsApi.respondToReview(reviewId, responseText);
    if (error) {
      toast.error("Failed to submit response");
      return;
    }
    toast.success("Response submitted");
    setRespondingTo(null);
    setResponseText("");
    fetchData();
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
        <Button variant="outline" size="sm" onClick={fetchData}>
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await adminAnnouncementsApi.getAll();
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
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
      const { error } = await adminAnnouncementsApi.update(editingId, payload);
      if (error) {
        toast.error("Failed to update announcement");
        return;
      }
      toast.success("Announcement updated");
    } else {
      const { error } = await adminAnnouncementsApi.create(payload);
      if (error) {
        toast.error("Failed to create announcement");
        return;
      }
      toast.success("Announcement created");
    }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    const { error } = await adminAnnouncementsApi.delete(id);
    if (error) {
      toast.error("Failed to delete announcement");
      return;
    }
    toast.success("Announcement deleted");
    fetchData();
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
    const { error } = await adminAnnouncementsApi.update(announcement.id, {
      isActive: !announcement.isActive,
    });
    if (error) {
      toast.error("Failed to update announcement");
      return;
    }
    toast.success(announcement.isActive ? "Announcement deactivated" : "Announcement activated");
    fetchData();
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
          />
          <Textarea
            placeholder="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
          />
          <Input
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
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
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/reviews" element={<ReviewsManagement />} />
            <Route path="/announcements" element={<AnnouncementsManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
