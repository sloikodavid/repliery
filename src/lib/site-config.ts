const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!configuredSiteUrl) {
	throw new Error("NEXT_PUBLIC_SITE_URL is not set.");
}

export const siteConfig = {
	name: "Repliery",
	origin: new URL(configuredSiteUrl).origin,
} as const;
