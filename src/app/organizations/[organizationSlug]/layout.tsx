import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ConvexAuthBoundary } from "@/components/providers/convex-auth-boundary";

export default async function OrganizationLayout({
	children,
	params,
}: LayoutProps<"/organizations/[organizationSlug]">) {
	const [{ organizationSlug }, authentication] = await Promise.all([
		params,
		auth(),
	]);
	if (!authentication.isAuthenticated) {
		await authentication.redirectToSignIn();
	}
	if (authentication.orgSlug !== organizationSlug) {
		notFound();
	}
	return <ConvexAuthBoundary>{children}</ConvexAuthBoundary>;
}
