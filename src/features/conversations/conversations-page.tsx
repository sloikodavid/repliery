"use client";

import { IconMessageCircle } from "@tabler/icons-react";
import { usePaginatedQuery } from "convex/react";
import { PageEmptyState } from "@/components/page-empty-state";
import { PageHeader } from "@/components/page-header";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function ConversationsPage({ businessId }: { businessId: string }) {
	const { results, status } = usePaginatedQuery(
		api.conversations.list,
		{ businessId: businessId as Id<"businesses"> },
		{ initialNumItems: 1 },
	);
	return (
		<section className="space-y-4">
			<PageHeader title="Conversations" />
			{status !== "LoadingFirstPage" && results.length === 0 ? (
				<PageEmptyState
					icon={<IconMessageCircle />}
					title="No conversations yet"
					description="Conversations for this business will appear here."
				/>
			) : null}
		</section>
	);
}
