import { BusinessShell } from "@/features/businesses/business-shell";

export default async function BusinessLayout({
	children,
	params,
}: LayoutProps<"/organizations/[organizationSlug]/businesses/[businessId]">) {
	const { organizationSlug, businessId } = await params;
	return (
		<BusinessShell organizationSlug={organizationSlug} businessId={businessId}>
			{children}
		</BusinessShell>
	);
}
