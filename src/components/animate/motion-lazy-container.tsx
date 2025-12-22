"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { ReactNode } from "react";

interface MotionLazyContainerProps {
  children: ReactNode;
}

export function MotionLazyContainer({ children }: MotionLazyContainerProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: "100%" }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}