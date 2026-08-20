import {
	paginationOptsValidator,
	paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import {
	addValidatedBusinessMembership,
	authorizeBusinessMembershipAddition,
	listBusinessMemberships,
	removeBusinessMembership,
} from "./model/businessMemberships";
import { businessMembershipDocumentValidator } from "./validators";

export const list = query({
	args: {
		businessId: v.id("businesses"),
		paginationOpts: paginationOptsValidator,
	},
	returns: paginationResultValidator(businessMembershipDocumentValidator),
	handler: (ctx, args) => listBusinessMemberships(ctx, args),
});

export const authorizeAdd = internalQuery({
	args: { businessId: v.id("businesses") },
	returns: v.object({
		clerkOrganizationId: v.string(),
		issuer: v.string(),
	}),
	handler: (ctx, args) =>
		authorizeBusinessMembershipAddition(ctx, args.businessId),
});

export const addValidated = internalMutation({
	args: {
		businessId: v.id("businesses"),
		clerkOrganizationMembershipId: v.string(),
		clerkUserId: v.string(),
		clerkUserTokenIdentifier: v.string(),
	},
	returns: v.id("businessMemberships"),
	handler: (ctx, args) => addValidatedBusinessMembership(ctx, args),
});

export const remove = mutation({
	args: {
		businessId: v.id("businesses"),
		businessMembershipId: v.id("businessMemberships"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await removeBusinessMembership(ctx, args);
		return null;
	},
});
