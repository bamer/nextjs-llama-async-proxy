"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Skeleton } from "@mui/material";
import { motion } from "framer-motion";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  placeholder?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function LazyImage({ src, alt, width, height, placeholder, className, style }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    const handleLoad = () => {
      setLoaded(true);
      setError(false);
    };

    const handleError = () => {
      setError(true);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [src]);

  if (error) {
    return placeholder || <Box>Image failed to load</Box>;
  }

  if (!loaded) {
    return (
      <Skeleton
        variant="rectangular"
        width={width || '100%'}
        height={height || '100%'}
        animation="wave"
        sx={{ borderRadius: "8px" }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        component="img"
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        sx={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
          borderRadius: "8px",
        }}
      />
    </motion.div>
  );
}