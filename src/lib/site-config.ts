const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const siteConfig = {
	name: "Repliery",
	url: siteUrl,
	routes: {
		home: "/",
		signIn: "/sign-in",
		waitlist: "/waitlist",
	},
} as const;
