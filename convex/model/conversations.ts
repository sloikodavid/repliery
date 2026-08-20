import type { PaginationOptions } from "convex/server";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { requireBusinessAccess, requireConversationAccess } from "./businesses";

export async function listConversations(
	ctx: QueryCtx,
	args: {
		businessId: Id<"businesses">;
		paginationOpts: PaginationOptions;
	},
) {
	await requireBusinessAccess(ctx, args.businessId);
	return await ctx.db
		.query("conversations")
		.withIndex("by_businessId", (query) =>
			query.eq("businessId", args.businessId),
		)
		.order("desc")
		.paginate(args.paginationOpts);
}

export async function getConversation(
	ctx: QueryCtx,
	args: {
		businessId: Id<"businesses">;
		conversationId: Id<"conversations">;
	},
) {
	const { conversation } = await requireConversationAccess(
		ctx,
		args.businessId,
		args.conversationId,
	);
	return conversation;
}
