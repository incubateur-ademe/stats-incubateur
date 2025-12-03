"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { type PropsWithChildren } from "react";

export interface ScrollTopButtonProps extends PropsWithChildren {
  skipHeader?: boolean;
  smooth?: boolean;
}

export const ScrollTopButton = ({ children, skipHeader, smooth }: ScrollTopButtonProps) => (
  <Button
    iconId="fr-icon-arrow-up-fill"
    priority="tertiary no outline"
    onClick={() =>
      window.scrollTo({
        behavior: smooth ? "smooth" : "auto",
        top: skipHeader ? (document.querySelector("header")?.getBoundingClientRect().height ?? 0) : 0,
      })
    }
  >
    {children}
  </Button>
);
