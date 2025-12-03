import { type MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  // private site, no need to index
  return {
    rules: {
      disallow: "/",
      userAgent: "*",
    },
  };
};

export default robots;
