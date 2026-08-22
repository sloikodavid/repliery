import {
	paginationOptsValidator,
	paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
	createBusiness,
	getBusiness,
	getBusinessNavigation,
	listBusinesses,
	purgeBusiness,
	requestBusinessDeletion,
} from "./model/businesses";
import { businessDocumentValidator, businessSortValidator } from "./validators";

export const navigation = query({
	args: { clerkOrganizationId: v.string() },
	returns: v.union(
		v.null(),
		v.object({ kind: v.literal("businesses") }),
		v.object({
			kind: v.literal("business"),
			businessId: v.id("businesses"),
			businessName: v.string(),
		}),
	),
	handler: (ctx, args) => getBusinessNavigation(ctx, args.clerkOrganizationId),
});

export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.string(),
		sort: businessSortValidator,
	},
	returns: paginationResultValidator(businessDocumentValidator),
	handler: (ctx, args) =>
		listBusinesses(ctx, args.paginationOpts, args.search, args.sort),
});

export const get = query({
	args: { businessId: v.id("businesses") },
	returns: businessDocumentValidator,
	handler: (ctx, args) => getBusiness(ctx, args.businessId),
});

export const create = mutation({
	args: { name: v.string() },
	returns: v.id("businesses"),
	handler: (ctx, args) => createBusiness(ctx, args.name),
});

export const requestDeletion = mutation({
	args: { businessId: v.id("businesses") },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requestBusinessDeletion(ctx, args.businessId);
		return null;
	},
});

export const purge = internalMutation({
	args: { businessId: v.id("businesses") },
	returns: v.null(),
	handler: async (ctx, args) => {
		await purgeBusiness(ctx, args.businessId);
		return null;
	},
});
