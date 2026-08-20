import { ConversationPage } from "@/features/conversations/conversation-page";

export default async function Page({
	params,
}: PageProps<"/organizations/[organizationSlug]/businesses/[businessId]/conversations/[conversationId]">) {
	const { businessId, conversationId } = await params;
	return (
		<ConversationPage businessId={businessId} conversationId={conversationId} />
	);
}
