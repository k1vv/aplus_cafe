import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, menuApi, adminReviewsApi, adminAnnouncementsApi, Order } from "@/lib/api";
import { toast } from "sonner";

// Orders - with real-time polling
export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await adminApi.getAllOrders();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 0, // Always consider data stale for real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
    refetchOnWindowFocus: true, // Refetch immediately when user returns to tab
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await adminApi.updateOrderStatus(id, status, reason);
      if (error) throw new Error(error);
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin", "orders"] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueryData<Order[]>(["admin", "orders"]);

      // Optimistically update
      queryClient.setQueryData<Order[]>(["admin", "orders"], (old) =>
        old?.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      );

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(["admin", "orders"], context.previousOrders);
      }
      toast.error("Failed to update status");
    },
    onSuccess: () => {
      toast.success("Status updated");
    },
    onSettled: () => {
      // Refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: number }) => {
      const { error } = await adminApi.assignRider(orderId, riderId);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Rider assigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => {
      toast.error("Failed to assign rider");
    },
  });
}

export function useUnassignRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await adminApi.unassignRider(orderId);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Rider unassigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => {
      toast.error("Failed to unassign rider");
    },
  });
}

// Riders
export function useRiders() {
  return useQuery({
    queryKey: ["admin", "riders"],
    queryFn: async () => {
      const { data, error } = await adminApi.getRiders();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 10 * 1000, // 10 seconds - rider availability changes frequently
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds
  });
}

// Analytics
export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const { data, error } = await adminApi.getAnalytics();
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

// Menu Management
export function useAdminMenu() {
  return useQuery({
    queryKey: ["admin", "menu"],
    queryFn: async () => {
      const [menuRes, catRes] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories(),
      ]);
      return {
        items: menuRes.data || [],
        categories: catRes.data || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await adminApi.createMenuItem(data);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Item created");
      queryClient.invalidateQueries({ queryKey: ["admin", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] }); // Also invalidate public menu cache
    },
    onError: () => {
      toast.error("Failed to create item");
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { error } = await adminApi.updateMenuItem(id, data);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: () => {
      toast.error("Failed to update item");
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await adminApi.deleteMenuItem(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });
}

// Reservations
export function useAdminReservations(dateFilter?: string) {
  return useQuery({
    queryKey: ["admin", "reservations", dateFilter],
    queryFn: async () => {
      const { data, error } = await adminApi.getAllReservations(dateFilter);
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await adminApi.updateReservationStatus(id, status);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "reservations"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });
}

// Users
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await adminApi.getAllUsers();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminApi.deleteUser(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "riders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete user");
    },
  });
}

// Riders
export function useCreateRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string; phone?: string; vehicleType: string; licensePlate: string }) => {
      const { error } = await adminApi.createRider(data);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Rider created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "riders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create rider");
    },
  });
}

// Reviews
export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const [reviewsRes, statsRes] = await Promise.all([
        adminReviewsApi.getAllReviews(),
        adminReviewsApi.getReviewStats(),
      ]);
      return {
        reviews: reviewsRes.data || [],
        stats: statsRes.data || null,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: number; response: string }) => {
      const { error } = await adminReviewsApi.respondToReview(reviewId, response);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Response submitted");
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: () => {
      toast.error("Failed to submit response");
    },
  });
}

// Announcements
export function useAdminAnnouncements() {
  return useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await adminAnnouncementsApi.getAll();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await adminAnnouncementsApi.create(data);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Announcement created");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: () => {
      toast.error("Failed to create announcement");
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { error } = await adminAnnouncementsApi.update(id, data);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Announcement updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: () => {
      toast.error("Failed to update announcement");
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await adminAnnouncementsApi.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: () => {
      toast.error("Failed to delete announcement");
    },
  });
}
