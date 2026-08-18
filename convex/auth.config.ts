import type { AuthConfig } from "convex/server";

const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL;

if (!clerkFrontendApiUrl) {
	throw new Error(
		"CLERK_FRONTEND_API_URL is not set in this Convex deployment.",
	);
}

export default {
	providers: [
		{
			domain: clerkFrontendApiUrl,
			applicationID: "convex",
		},
	],
} satisfies AuthConfig;
