import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/obrigado", "/agradecimento", "/api/", "/lp-"],
    },
    sitemap: "https://assessorialpha.com/sitemap.xml",
  };
}
