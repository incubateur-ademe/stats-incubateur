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
  "base-uri": ["'self'", ...FRIENDS],
  "connect-src": ["'self'", ...FRIENDS, isDev && "http://localhost"],
  "default-src": ["'none'"],
  "font-src": ["'self'"],
  "form-action": ["'self'", ...FRIENDS],
  "frame-ancestors": ["'self'"],
  "frame-src": ["'none'"],
  "img-src": ["'self'", "data:"],
  "media-src": ["'self'"],
  "object-src": ["'self'", "data:"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...FRIENDS, isDev && "http://localhost"],
  "style-src": ["'self'", "'unsafe-inline'"],
  ...(!isDev && {
    "block-all-mixed-content": [],
    "upgrade-insecure-requests": [],
  }),
};

const ContentSecurityPolicy = Object.entries(csp)
  .map(([key, value]) => `${key} ${value.filter(Boolean).join(" ")};`)
  .join(" ");

const config: NextConfig = {
  env,
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ["@/lib/repo", "@/dsfr/client", "@/dsfr"],
    serverMinification: true,
    taint: true,
    turbopackFileSystemCacheForDev: true,
  },
  headers() {
    return Promise.resolve<Header[]>([
      {
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
        source: "/(.*)",
      },
    ]);
  },
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  poweredByHeader: false,
  reactCompiler: true,

  turbopack: {},
};

export default config;
