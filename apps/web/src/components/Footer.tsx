import { Link } from "react-router-dom";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

export default function Footer() {
  const address = "Universiti Tenaga Nasional (UNITEN), Jalan IKRAM-UNITEN, 43000 Kajang, Selangor";
  const googleMapsUrl = "https://www.google.com/maps/place/Universiti+Tenaga+Nasional+(UNITEN)";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=Universiti+Tenaga+Nasional+UNITEN`;

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Interactive Google Maps Section */}
      <AnimateOnScroll animation="fade-in" delay={0}>
        <div className="relative w-full h-64 sm:h-80 md:h-[420px] group">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500!2d101.7318634!3d2.9709002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cdcb056926651f%3A0xa9e35eff2d3b45a6!2sMZ%20D'Tasek%20Hall!5e0!3m2!1sen!2smy!4v1700000000000"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="APlus Cafe Location - UNITEN"
          />

          {/* Floating info card */}
          <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-sm bg-primary/95 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-2xl border border-primary-foreground/10">
            <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-accent" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-wide mb-1">APlus Coffee & Pastry</h4>
                <p className="text-[10px] sm:text-[11px] leading-relaxed opacity-70" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {address}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-1.5 bg-accent text-accent-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Directions
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-1.5 border border-primary-foreground/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-primary-foreground/10 transition-colors"
              >
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                View Map
              </a>
            </div>
          </div>
        </div>
      </AnimateOnScroll>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 px-4 sm:px-10 py-12 sm:py-20 text-center">
        <AnimateOnScroll animation="fade-in-up" delay={0}>
          <div>
            <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Contact</h3>
            <p className="text-[11px] sm:text-xs leading-relaxed opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
              admin@aplus.com<br />
              017-370 5326
            </p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll animation="fade-in-up" delay={100}>
          <div>
            <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Opening Hours</h3>
            <p className="text-[11px] sm:text-xs leading-relaxed opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
              Weekdays: 8AM - 6PM<br />
              Weekends: 9AM - 4PM
            </p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll animation="fade-in-up" delay={200}>
          <div>
            <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Find Us</h3>
            <p className="text-[11px] sm:text-xs leading-relaxed opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
              UNITEN, Jalan IKRAM-UNITEN<br />
              43000 Kajang, Selangor
            </p>
          </div>
        </AnimateOnScroll>
      </div>
      <div className="border-t border-primary-foreground/20 px-4 sm:px-10 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
          © 2026 APlus Coffee &amp; Pastry
        </p>
        <Link to="/book" className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] opacity-60 hover:opacity-100 transition-opacity" style={{ fontFamily: "'Space Mono', monospace" }}>
          Book a Table →
        </Link>
      </div>
    </footer>
  );
}
