import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
	organizationSyncOptions: {
		organizationPatterns: ["/organizations/:slug", "/organizations/:slug/(.*)"],
	},
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
		"/api(.*)",
		"/__clerk/(.*)",
	],
};
