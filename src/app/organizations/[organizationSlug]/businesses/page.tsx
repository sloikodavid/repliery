import { BusinessesPage } from "@/features/businesses/businesses-page";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses">) {
	const { organizationSlug } = await params;
	return <BusinessesPage organizationSlug={organizationSlug} />;
}
