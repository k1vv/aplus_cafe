import cafeLatte from "@/assets/cafe-latte.jpg";
import cafeIcedCoffee from "@/assets/cafe-iced-coffee.jpg";
import cafeCroissant from "@/assets/cafe-croissant.jpg";
import AnimateOnScroll from "./AnimateOnScroll";

export default function AboutSection() {
  return (
    <section className="bg-background">
      {/* Photo grid with hover zoom */}
      <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
        <AnimateOnScroll animation="fade-in-scale" delay={0}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={cafeLatte}
              alt="Coffee at APlus"
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll animation="fade-in-scale" delay={100}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={cafeIcedCoffee}
              alt="Iced coffee at APlus"
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll animation="fade-in-scale" delay={200}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={cafeCroissant}
              alt="Pastry at APlus"
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </AnimateOnScroll>
      </div>

      {/* Description with fade-in */}
      <div className="px-4 sm:px-6 py-12 sm:py-24 text-center max-w-2xl mx-auto">
        <AnimateOnScroll animation="fade-in-up" delay={100}>
          <p
            className="text-base sm:text-lg md:text-xl leading-relaxed text-primary"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            APlus is for morning rituals, quiet afternoons, catch-ups with friends, and pastries that make you smile.
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
