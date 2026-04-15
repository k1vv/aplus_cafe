import { useState, useEffect } from "react";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, LayoutDashboard, UtensilsCrossed, Package, CalendarDays, Users,
  Plus, Edit2, Trash2, Check, X, ChevronDown, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi, menuApi, MenuItemResponse, Order, Reservation, AdminUser,
  CategoryResponse, CreateMenuItemRequest
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Orders", icon: Package },
  { path: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { path: "/admin/users", label: "Users", icon: Users },
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
  const [stats, setStats] = useState({ orders: 0, reservations: 0, users: 0, menuItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, reservationsRes, usersRes, menuRes] = await Promise.all([
        adminApi.getAllOrders(),
        adminApi.getAllReservations(),
        adminApi.getAllUsers(),
        menuApi.getMenuItems(),
      ]);

      setStats({
        orders: ordersRes.data?.length || 0,
        reservations: reservationsRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        menuItems: menuRes.data?.length || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Orders", value: stats.orders, icon: Package, color: "text-blue-500" },
    { label: "Reservations", value: stats.reservations, icon: CalendarDays, color: "text-green-500" },
    { label: "Users", value: stats.users, icon: Users, color: "text-purple-500" },
    { label: "Menu Items", value: stats.menuItems, icon: UtensilsCrossed, color: "text-orange-500" },
  ];

  return (
    <div>
      <h2 className="text-xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>Dashboard Overview</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
            );
          })}
        </div>
      )}
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await adminApi.getAllOrders();
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await adminApi.updateOrderStatus(id, status);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success("Status updated");
    fetchOrders();
  };

  const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

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
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                  </span>
                  <div className="font-bold mt-1">RM {Number(order.grandTotal).toFixed(2)}</div>
                </div>
                <select
                  className="text-xs px-2 py-1 rounded border border-border bg-background"
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-muted-foreground">
                {order.orderItems?.map((item) => `${item.quantity}× ${item.itemName}`).join(", ")}
              </div>
            </div>
          ))}
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

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Admin Dashboard
          </h1>
          <div className="w-12 sm:w-16" />
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
          </Routes>
        </div>
      </div>
    </div>
  );
}
