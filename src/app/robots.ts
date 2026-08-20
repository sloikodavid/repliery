import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [routes.organizations.index, routes.signIn],
		},
		sitemap: new URL("/sitemap.xml", siteConfig.origin).href,
	};
}
