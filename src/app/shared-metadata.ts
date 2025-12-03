import { type Metadata } from "next";

import { config } from "@/config";

const description = config.brand.tagline;

export const sharedMetadata: Metadata = {
  description,
  openGraph: {
    countryName: "France",
    description,
    images: [
      {
        alt: config.brand.name,
        url: new URL(`/img/ademe-incubateur-logo.png`, config.host),
      },
    ],
    locale: "fr_FR",
    siteName: config.brand.name,
    type: "website",
  },
};
