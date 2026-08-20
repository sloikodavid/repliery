import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { BusinessMembersPage } from "@/features/business-memberships/business-members-page";
import { clerkPermissions } from "../../../../../../../convex/clerkContract";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses/[businessId]/members">) {
	const [{ businessId }, authentication] = await Promise.all([params, auth()]);
	if (
		!authentication.has({
			permission: clerkPermissions.manageBusinessMemberships,
		})
	) {
		notFound();
	}
	return <BusinessMembersPage businessId={businessId} />;
}
