import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: new URL(routes.root, siteConfig.origin).href,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: new URL(routes.waitlist, siteConfig.origin).href,
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];
}
