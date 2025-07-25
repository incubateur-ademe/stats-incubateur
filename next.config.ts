import { type NextConfig } from "next";
import { type Header } from "next/dist/lib/load-custom-routes";

import packageJson from "./package.json" with { type: "json" };

const { version } = packageJson;

const isDeployment = !!process.env.SOURCE_VERSION;

const env = {
  NEXT_PUBLIC_APP_VERSION: version,
  NEXT_PUBLIC_APP_VERSION_COMMIT: isDeployment ? process.env.SOURCE_VERSION : "dev",
};

const isDev = process.env.NODE_ENV === "development";

const FRIENDS = ["https://*.gouv.fr", "https://*.ademe.fr", "https://ademe.fr"];
const csp = {
  "default-src": ["'none'"],
  "connect-src": ["'self'", ...FRIENDS, isDev && "http://localhost"],
  "font-src": ["'self'"],
  "media-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...FRIENDS, isDev && "http://localhost"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "object-src": ["'self'", "data:"],
  "frame-ancestors": ["'self'"],
  "base-uri": ["'self'", ...FRIENDS],
  "form-action": ["'self'", ...FRIENDS],
  "frame-src": ["'none'"],
  ...(!isDev && {
    "block-all-mixed-content": [],
    "upgrade-insecure-requests": [],
  }),
};

const ContentSecurityPolicy = Object.entries(csp)
  .map(([key, value]) => `${key} ${value.filter(Boolean).join(" ")};`)
  .join(" ");

const config: NextConfig = {
  poweredByHeader: false,
  // output: "standalone",
  // webpack: (config: Configuration) => {
  //   config.module?.rules?.push({
  //     test: /\.(woff2|webmanifest|ttf)$/,
  //     type: "asset/resource",
  //   });

  //   return config;
  // },
  experimental: {
    serverMinification: true,
    authInterrupts: true,
    optimizePackageImports: ["@/lib/repo", "@/dsfr/client", "@/dsfr"],
    strictNextHead: true,
    taint: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  turbopack: {},

  headers() {
    return Promise.resolve<Header[]>([
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer, strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "fullscreen=(), display-capture=(), camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ]);
  },
};

export default config;
