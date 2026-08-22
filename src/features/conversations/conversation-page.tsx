"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function ConversationPage({
	businessId,
	conversationId,
}: {
	businessId: string;
	conversationId: string;
}) {
	useQuery(api.conversations.get, {
		businessId: businessId as Id<"businesses">,
		conversationId: conversationId as Id<"conversations">,
	});
	// Conversation details are intentionally reserved for the next feature slice.
	return null;
}
