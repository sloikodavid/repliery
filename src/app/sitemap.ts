import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${siteConfig.url}${siteConfig.routes.home}`,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${siteConfig.url}${siteConfig.routes.waitlist}`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];
}
