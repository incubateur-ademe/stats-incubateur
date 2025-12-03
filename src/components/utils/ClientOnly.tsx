"use client";

import { type SuspenseProps, useEffect, useState } from "react";

export const ClientOnly = ({ children, fallback }: SuspenseProps) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return hasMounted;
}
