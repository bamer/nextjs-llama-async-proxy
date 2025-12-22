"use client";

import { motion, LazyMotion, domAnimation } from "framer-motion";
import React, { ReactNode } from "react";

interface MotionLazyContainerProps {
  children: ReactNode;
}

export function MotionLazyContainer({ children }: MotionLazyContainerProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </LazyMotion>
  );
}