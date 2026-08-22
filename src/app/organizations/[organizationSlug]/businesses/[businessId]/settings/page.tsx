import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { BusinessSettingsPage } from "@/features/businesses/business-settings-page";
import { clerkPermissions } from "../../../../../../../shared/clerk-contract";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses/[businessId]/settings">) {
	const [{ organizationSlug, businessId }, authentication] = await Promise.all([
		params,
		auth(),
	]);
	if (
		!authentication.has({
			permission: clerkPermissions.manageBusinesses,
		})
	) {
		notFound();
	}
	return (
		<BusinessSettingsPage
			organizationSlug={organizationSlug}
			businessId={businessId}
		/>
	);
}
