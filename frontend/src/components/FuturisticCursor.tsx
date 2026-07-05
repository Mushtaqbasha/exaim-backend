"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function FuturisticCursor() {
  // 1. Setup the raw mouse coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  // 2. Wrap them in a Spring for that smooth, lag-free physics feel
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      // Trigger the zoom effect if hovering the main title or any button
      if (target.id === "hero-title" || target.tagName === "BUTTON") {
        setIsHoveringTitle(true);
      } else {
        setIsHoveringTitle(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 9999, // Moved here to fix your yellow warning!
      }}
      className={`fixed top-0 left-0 pointer-events-none rounded-full border transition-all duration-150 ease-out will-change-transform ${
        isHoveringTitle 
          ? "w-24 h-24 border-blue-400 bg-blue-500/10" 
          : "w-6 h-6 border-blue-500/50 bg-blue-500/20"
      }`}
    >
      {!isHoveringTitle && (
        <div className="absolute inset-0 m-auto w-1 h-1 bg-blue-400 rounded-full" />
      )}
    </motion.div>
  );
}