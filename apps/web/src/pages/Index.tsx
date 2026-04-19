import { useState } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import AboutSection from "@/components/AboutSection";
import VibeSection from "@/components/VibeSection";
import CategoryFilter from "@/components/CategoryFilter";
import MenuCard from "@/components/MenuCard";
import MenuItemModal from "@/components/MenuItemModal";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { MenuItem } from "@/data/menuData";
import { useMenu } from "@/hooks/useMenu";

const SCROLL_THRESHOLD = 6;

export default function Index() {
  const [category, setCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { menuItems, categories, loading, error } = useMenu();

  const filtered = category === "All" ? menuItems : menuItems.filter((i) => i.category === category);
  const shouldScroll = filtered.length > SCROLL_THRESHOLD;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />
      <AboutSection />
      <VibeSection />

      <section className="bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
          <div className="mb-8 sm:mb-10 text-center">
            <AnimateOnScroll animation="fade-in-up" delay={0}>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl text-foreground mb-4 sm:mb-6"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Our Menu
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-in" delay={100}>
              <CategoryFilter
                selected={category}
                onSelect={setCategory}
                categories={categories}
              />
            </AnimateOnScroll>
          </div>

          {loading ? (
            <div className="py-12 sm:py-16 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="mt-4 text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                Loading menu...
              </p>
            </div>
          ) : error ? (
            <p className="py-12 sm:py-16 text-center text-red-500 text-xs sm:text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              {error}
            </p>
          ) : (
            <div
              className={shouldScroll ? "max-h-[600px] sm:max-h-[700px] overflow-y-auto pr-2 scrollbar-thin" : ""}
            >
              {filtered.map((item, index) => (
                <AnimateOnScroll key={item.id} animation="fade-in-up" delay={Math.min(index, 5) * 50} threshold={0.05}>
                  <MenuCard
                    item={item}
                    onSelect={setSelectedItem}
                    index={index}
                  />
                </AnimateOnScroll>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="py-12 sm:py-16 text-center text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              No items in this category yet.
            </p>
          )}
        </div>
      </section>

      <Footer />

      {selectedItem && (
        <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
