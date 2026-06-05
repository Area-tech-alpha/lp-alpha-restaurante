import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Assessoria Alpha",
    short_name: "Alpha",
    description: "A maior assessoria de marketing gastronômico da América Latina",
    start_url: "/",
    display: "browser",
    background_color: "#0A0A0A",
    theme_color: "#F5A623",
    icons: [
      {
        src: "/Logo-Alpha.png.webp",
        sizes: "any",
        type: "image/webp",
      },
    ],
  };
}
