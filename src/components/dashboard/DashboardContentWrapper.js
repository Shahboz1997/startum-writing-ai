'use client';

import { motion } from 'framer-motion';

const slideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function DashboardContentWrapper({ children }) {
  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={slideUp.transition}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
    >
      {children}
    </motion.div>
  );
}
