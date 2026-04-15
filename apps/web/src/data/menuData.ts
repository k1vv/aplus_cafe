import cafeLatte from "@/assets/cafe-latte.jpg";
import cafeIcedCoffee from "@/assets/cafe-iced-coffee.jpg";
import cafeMatcha from "@/assets/cafe-matcha.jpg";
import cafeCroissant from "@/assets/cafe-croissant.jpg";
import cafeTiramisu from "@/assets/cafe-tiramisu.jpg";
import cafeCappuccino from "@/assets/cafe-cappuccino.jpg";
import cafeMocha from "@/assets/cafe-mocha.jpg";
import cafeAffogato from "@/assets/cafe-affogato.jpg";
import cafeMuffin from "@/assets/cafe-muffin.jpg";
import cafeCinnamonRoll from "@/assets/cafe-cinnamon-roll.jpg";
import cafeChocCake from "@/assets/cafe-choc-cake.jpg";
import cafeScone from "@/assets/cafe-scone.jpg";
import { MenuItemResponse } from "@/lib/api";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// Image mapping for menu items (maps imageUrl paths to local assets)
const imageMap: Record<string, string> = {
  "/images/cafe-latte.jpg": cafeLatte,
  "/images/cafe-cappuccino.jpg": cafeCappuccino,
  "/images/cafe-iced-coffee.jpg": cafeIcedCoffee,
  "/images/cafe-matcha.jpg": cafeMatcha,
  "/images/cafe-mocha.jpg": cafeMocha,
  "/images/cafe-affogato.jpg": cafeAffogato,
  "/images/cafe-croissant.jpg": cafeCroissant,
  "/images/cafe-muffin.jpg": cafeMuffin,
  "/images/cafe-cinnamon-roll.jpg": cafeCinnamonRoll,
  "/images/cafe-choc-cake.jpg": cafeChocCake,
  "/images/cafe-scone.jpg": cafeScone,
  "/images/cafe-tiramisu.jpg": cafeTiramisu,
};

// Convert API response to MenuItem format
export function mapApiToMenuItem(item: MenuItemResponse): MenuItem {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description || "",
    price: item.price,
    image: imageMap[item.imageUrl] || item.imageUrl || cafeLatte,
    category: item.categoryName,
  };
}

// Fallback static data (used if API fails)
export const categories = ["All", "Coffee", "Pastry"];

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Café Latte",
    description: "Smooth espresso with steamed milk and a layer of foam",
    price: 6.5,
    image: cafeLatte,
    category: "Coffee",
    popular: true,
  },
  {
    id: "2",
    name: "Cappuccino",
    description: "Rich espresso with velvety steamed milk and thick foam",
    price: 6.5,
    image: cafeCappuccino,
    category: "Coffee",
    popular: true,
  },
  {
    id: "3",
    name: "Iced Coffee",
    description: "Double-shot espresso over ice with fresh milk",
    price: 7.0,
    image: cafeIcedCoffee,
    category: "Coffee",
  },
  {
    id: "4",
    name: "Matcha Latte",
    description: "Premium Japanese matcha whisked with oat milk",
    price: 7.5,
    image: cafeMatcha,
    category: "Coffee",
  },
  {
    id: "5",
    name: "Café Mocha",
    description: "Espresso blended with chocolate and topped with cream",
    price: 8.0,
    image: cafeMocha,
    category: "Coffee",
  },
  {
    id: "6",
    name: "Affogato",
    description: "Vanilla gelato drowned in a shot of hot espresso",
    price: 9.5,
    image: cafeAffogato,
    category: "Coffee",
  },
  {
    id: "7",
    name: "Butter Croissant",
    description: "Flaky, golden French croissant — freshly baked daily",
    price: 4.9,
    image: cafeCroissant,
    category: "Pastry",
    popular: true,
  },
  {
    id: "8",
    name: "Blueberry Muffin",
    description: "Soft and fluffy muffin loaded with fresh blueberries",
    price: 5.5,
    image: cafeMuffin,
    category: "Pastry",
  },
  {
    id: "9",
    name: "Cinnamon Roll",
    description: "Warm swirl of cinnamon with sweet cream cheese glaze",
    price: 6.9,
    image: cafeCinnamonRoll,
    category: "Pastry",
    popular: true,
  },
  {
    id: "10",
    name: "Chocolate Cake",
    description: "Rich double-layer chocolate cake with ganache frosting",
    price: 10.9,
    image: cafeChocCake,
    category: "Pastry",
  },
  {
    id: "11",
    name: "Scone with Jam",
    description: "Freshly baked scone served with clotted cream and jam",
    price: 5.9,
    image: cafeScone,
    category: "Pastry",
  },
  {
    id: "12",
    name: "Tiramisu",
    description: "Mascarpone cream, espresso-soaked ladyfingers and cocoa",
    price: 9.9,
    image: cafeTiramisu,
    category: "Pastry",
  },
];
