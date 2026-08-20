import { ConversationsPage } from "@/features/conversations/conversations-page";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses/[businessId]/conversations">) {
	const { businessId } = await params;
	return <ConversationsPage businessId={businessId} />;
}
