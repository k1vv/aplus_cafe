export default function HeroBanner() {
  return (
    <section className="bg-primary text-primary-foreground overflow-hidden">
      <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 md:py-36 text-center">
        <p
          className="mb-4 sm:mb-6 text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-0 animate-fade-in"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          Coffee &amp; Pastry
        </p>
        <h2
          className="mb-4 sm:mb-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] opacity-0 animate-fade-in-up"
          style={{ fontFamily: "'DM Serif Display', serif", animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          Where every cup<br />
          tells a story
        </h2>
        <p
          className="max-w-xs sm:max-w-sm text-xs sm:text-sm leading-relaxed opacity-0 animate-fade-in-up"
          style={{ fontFamily: "'Space Mono', monospace", animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          Keep scrolling for<br />the good stuff.
        </p>
      </div>
    </section>
  );
}
