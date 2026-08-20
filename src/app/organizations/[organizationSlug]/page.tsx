import { OrganizationRedirect } from "@/features/organizations/organization-redirect";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]">) {
	const { organizationSlug } = await params;
	return <OrganizationRedirect organizationSlug={organizationSlug} />;
}
