"use client";

import { breakpoints } from "@codegouvfr/react-dsfr/fr/breakpoints";
import { useSyncExternalStore } from "react";

export const useBreakpoints = () => {
  type Breakpoint = "lg" | "md" | "sm" | "xl";

  const useMediaQuery = (breakpoint: Breakpoint) => {
    const query = breakpoints.up(breakpoint).replace("@media ", "");

    const getMedia = () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    };

    const subscribe = (notify: () => void) => {
      if (typeof window === "undefined") return () => undefined;

      const mql = window.matchMedia(query);
      const handler = () => notify();

      if (mql.addEventListener) {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      }

      mql.addListener(handler);
      return () => mql.removeListener(handler);
    };

    return useSyncExternalStore(subscribe, getMedia, () => false);
  };

  const isSmAndUp = useMediaQuery("sm");
  const isMdAndUp = useMediaQuery("md");
  const isLgAndUp = useMediaQuery("lg");
  const isXlAndUp = useMediaQuery("xl");

  return { isLgAndUp, isMdAndUp, isSmAndUp, isXlAndUp };
};
