import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lebanon-monitor.railway.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 1,
    },
  ];
}
