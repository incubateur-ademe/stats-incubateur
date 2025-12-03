"use client";
import { type PropsWithChildren, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ClientOnlyPortalProps = PropsWithChildren<{
  selector: string;
}>;

export function ClientOnlyPortal({ children, selector }: ClientOnlyPortalProps) {
  const [container, setContainer] = useState<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = document.querySelector(selector);
    let raf = 0;
    raf = requestAnimationFrame(() => {
      setContainer(el);
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [selector]);

  return mounted && container ? createPortal(children, container) : null;
}
