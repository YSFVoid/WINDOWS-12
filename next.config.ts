import type { NextConfig } from "next";

const isProductionBuild = process.env.NODE_ENV === "production";
const repositoryBasePath = "/WINDOWS-12";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProductionBuild ? repositoryBasePath : "",
  assetPrefix: isProductionBuild ? `${repositoryBasePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isProductionBuild ? repositoryBasePath : "",
  },
};

export default nextConfig;
