import { useEffect, useState } from "react";
import { menuApi, CategoryResponse } from "@/lib/api";
import { MenuItem, mapApiToMenuItem, menuItems as staticMenuItems, categories as staticCategories } from "@/data/menuData";

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [menuResult, categoriesResult] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories(),
      ]);

      if (menuResult.error || !menuResult.data || menuResult.data.length === 0) {
        // Fallback to static data if API fails
        console.warn("Using fallback static menu data");
        setMenuItems(staticMenuItems);
        setCategories(staticCategories);
      } else {
        // Map API response to MenuItem format
        const mappedItems = menuResult.data.map(mapApiToMenuItem);
        setMenuItems(mappedItems);

        // Build categories list
        if (categoriesResult.data && categoriesResult.data.length > 0) {
          const categoryNames = categoriesResult.data
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((c) => c.name);
          setCategories(["All", ...categoryNames]);
        } else {
          // Extract unique categories from menu items
          const uniqueCategories = [...new Set(mappedItems.map((item) => item.category))];
          setCategories(["All", ...uniqueCategories]);
        }
      }
    } catch (err) {
      console.error("Failed to load menu from API, using fallback:", err);
      setMenuItems(staticMenuItems);
      setCategories(staticCategories);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchMenuData();
  };

  return { menuItems, categories, loading, error, refresh };
}
