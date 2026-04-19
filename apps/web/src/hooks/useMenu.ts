import { useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi, CategoryResponse } from "@/lib/api";
import { MenuItem, mapApiToMenuItem, menuItems as staticMenuItems, categories as staticCategories } from "@/data/menuData";

export function useMenu() {
  const queryClient = useQueryClient();

  const { data: menuData, isLoading: menuLoading, error: menuError } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const [menuResult, categoriesResult] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories(),
      ]);

      if (menuResult.error || !menuResult.data || menuResult.data.length === 0) {
        // Fallback to static data if API fails
        console.warn("Using fallback static menu data");
        return {
          menuItems: staticMenuItems,
          categories: staticCategories,
        };
      }

      // Map API response to MenuItem format
      const mappedItems = menuResult.data.map(mapApiToMenuItem);

      // Build categories list
      let categoryNames: string[];
      if (categoriesResult.data && categoriesResult.data.length > 0) {
        categoryNames = ["All", ...categoriesResult.data
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((c) => c.name)];
      } else {
        // Extract unique categories from menu items
        const uniqueCategories = [...new Set(mappedItems.map((item) => item.category))];
        categoryNames = ["All", ...uniqueCategories];
      }

      return {
        menuItems: mappedItems,
        categories: categoryNames,
      };
    },
    staleTime: 10 * 60 * 1000, // Menu stays fresh for 10 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["menu"] });
  };

  return {
    menuItems: menuData?.menuItems || [],
    categories: menuData?.categories || ["All"],
    loading: menuLoading,
    error: menuError ? String(menuError) : null,
    refresh,
  };
}
