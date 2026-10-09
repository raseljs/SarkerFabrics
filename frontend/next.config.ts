import type { NextConfig } from "next";

type ImageRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

function apiUploadPattern(): ImageRemotePattern | null {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!configuredApiUrl) return null;

  try {
    const url = new URL(configuredApiUrl);
    const protocol = url.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return null;

    return {
      protocol,
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/uploads/**",
    };
  } catch {
    return null;
  }
}

const configuredApiPattern = apiUploadPattern();

const remotePatterns: ImageRemotePattern[] = [
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: "/**",
  },
  // Local backend media during development.
  {
    protocol: "http",
    hostname: "localhost",
    port: "5000",
    pathname: "/uploads/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "5000",
    pathname: "/uploads/**",
  },
];

if (
  configuredApiPattern &&
  !remotePatterns.some(
    (pattern) =>
      pattern.protocol === configuredApiPattern.protocol &&
      pattern.hostname === configuredApiPattern.hostname &&
      (pattern.port || "") === (configuredApiPattern.port || ""),
  )
) {
  remotePatterns.push(configuredApiPattern);
}

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    // Product cards intentionally use quality=72; keep the Next.js default 75 too.
    qualities: [72, 75],
    minimumCacheTTL: 86400,
  },
  // Fix Turbopack incorrectly detecting C:\Users\Md Shafiqul Islam\ as workspace
  // root due to a stray package-lock.json there. Explicitly set the correct root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
