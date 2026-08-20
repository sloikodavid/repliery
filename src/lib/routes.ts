export const routes = {
	root: "/",
	organizations: {
		index: "/organizations",
		bySlugTemplate: "/organizations/:slug",
		bySlug: (organizationSlug: string) =>
			`/organizations/${organizationSlug}` as const,
	},
	businesses: {
		index: (organizationSlug: string) =>
			`/organizations/${organizationSlug}/businesses` as const,
		byId: (organizationSlug: string, businessId: string) =>
			`/organizations/${organizationSlug}/businesses/${businessId}` as const,
	},
	conversations: {
		index: (organizationSlug: string, businessId: string) =>
			`/organizations/${organizationSlug}/businesses/${businessId}/conversations` as const,
		byId: (
			organizationSlug: string,
			businessId: string,
			conversationId: string,
		) =>
			`/organizations/${organizationSlug}/businesses/${businessId}/conversations/${conversationId}` as const,
	},
	businessMemberships: {
		index: (organizationSlug: string, businessId: string) =>
			`/organizations/${organizationSlug}/businesses/${businessId}/members` as const,
	},
	businessSettings: {
		index: (organizationSlug: string, businessId: string) =>
			`/organizations/${organizationSlug}/businesses/${businessId}/settings` as const,
	},
	signIn: "/sign-in",
	waitlist: "/waitlist",
} as const;

export function isPathWithin(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}
