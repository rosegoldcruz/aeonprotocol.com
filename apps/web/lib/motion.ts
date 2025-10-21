export const motionConfig = {
  transition: {
    type: "spring" as const,
    stiffness: 260,
    damping: 30,
    mass: 0.8,
  },
  stagger: 0.08,
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const hoverDepth = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { scale: 0.98 },
}

