import vibe1 from "@/assets/vibe-1.jpg";
import vibe2 from "@/assets/vibe-2.jpg";
import vibe3 from "@/assets/vibe-3.jpg";
import AnimateOnScroll from "./AnimateOnScroll";

export default function VibeSection() {
  return (
    <section className="bg-background py-12 sm:py-24 px-4 sm:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <AnimateOnScroll animation="fade-in" delay={0}>
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2 sm:mb-3"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              The Vibe
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-in-up" delay={100}>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-foreground"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Your happy place awaits
            </h2>
          </AnimateOnScroll>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <AnimateOnScroll animation="fade-in-scale" delay={0}>
            <div className="overflow-hidden rounded-lg aspect-[4/5] sm:aspect-auto">
              <img
                src={vibe1}
                alt="Cozy cafe interior with morning sunlight"
                loading="lazy"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-in-scale" delay={100}>
            <div className="overflow-hidden rounded-lg aspect-[4/5] sm:aspect-auto">
              <img
                src={vibe2}
                alt="Hand holding a cup of cappuccino with latte art"
                loading="lazy"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-in-scale" delay={200}>
            <div className="overflow-hidden rounded-lg aspect-[4/5] sm:aspect-auto">
              <img
                src={vibe3}
                alt="Freshly baked croissants on a wooden board"
                loading="lazy"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </AnimateOnScroll>
        </div>

        {/* Tagline */}
        <AnimateOnScroll animation="fade-in" delay={300}>
          <p
            className="text-center text-[11px] sm:text-xs text-muted-foreground mt-6 sm:mt-8 max-w-md mx-auto leading-relaxed px-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Good coffee, warm pastries, and a corner that feels like home.
            Come as you are — stay as long as you like.
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
