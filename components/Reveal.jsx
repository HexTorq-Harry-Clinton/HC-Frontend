"use client";

import { motion } from "framer-motion";

// Scroll-triggered reveal wrapper with Lenis smooth scroll compatibility.
export default function Reveal({
  children,
  delay = 0,
  y = 32,
  x = 0,
  scale = 1,
  blur = false,
  duration = 0.8,
  className = "",
  once = true,
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y,
        x,
        scale,
        filter: blur ? "blur(8px)" : "blur(0px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

