'use client';
import { useReducedMotion } from 'framer-motion';

export function useMotionConfig() {
  const shouldReduce = useReducedMotion();
  return {
    transition: shouldReduce ? { duration: 0 } : undefined,
    shouldReduce: !!shouldReduce,
  };
}
