import { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type AnimationType = "fade-in" | "fade-in-up" | "fade-in-scale" | "slide-in-left" | "slide-in-right";

interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export default function AnimateOnScroll({
  children,
  animation = "fade-in-up",
  delay = 0,
  duration = 600,
  className = "",
  threshold = 0.1,
}: AnimateOnScrollProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold });

  const getAnimationStyles = () => {
    const baseStyles = {
      opacity: isInView ? 1 : 0,
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      transitionDelay: `${delay}ms`,
    };

    switch (animation) {
      case "fade-in":
        return baseStyles;
      case "fade-in-up":
        return {
          ...baseStyles,
          transform: isInView ? "translateY(0)" : "translateY(30px)",
        };
      case "fade-in-scale":
        return {
          ...baseStyles,
          transform: isInView ? "scale(1)" : "scale(0.95)",
        };
      case "slide-in-left":
        return {
          ...baseStyles,
          transform: isInView ? "translateX(0)" : "translateX(-30px)",
        };
      case "slide-in-right":
        return {
          ...baseStyles,
          transform: isInView ? "translateX(0)" : "translateX(30px)",
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div ref={ref} style={getAnimationStyles()} className={className}>
      {children}
    </div>
  );
}
