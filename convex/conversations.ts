import {
	paginationOptsValidator,
	paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getConversation, listConversations } from "./model/conversations";
import { conversationDocumentValidator } from "./validators";

export const list = query({
	args: {
		businessId: v.id("businesses"),
		paginationOpts: paginationOptsValidator,
	},
	returns: paginationResultValidator(conversationDocumentValidator),
	handler: (ctx, args) => listConversations(ctx, args),
});

export const get = query({
	args: {
		businessId: v.id("businesses"),
		conversationId: v.id("conversations"),
	},
	returns: conversationDocumentValidator,
	handler: (ctx, args) => getConversation(ctx, args),
});
