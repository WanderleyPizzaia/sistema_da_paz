import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App 100% autenticada e dinâmica (lê cookie/banco a cada request),
  // então não usamos prerender estático / cache de componentes.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
