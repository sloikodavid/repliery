import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses/[businessId]">) {
	const { organizationSlug, businessId } = await params;
	redirect(routes.conversations.index(organizationSlug, businessId));
}
