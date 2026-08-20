import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
	clearDeletedUser as clearDeletedUserModel,
	clearOrganizationMembershipRevocation,
	processClerkLifecycleEvent,
	purgeOrganizationMemberships,
	purgeOrganization as purgeOrganizationModel,
	purgeUser as purgeUserModel,
} from "./model/clerkWebhooks";

const clerkLifecycleEventValidator = v.union(
	v.object({
		type: v.literal("organizationMembership.deleted"),
		clerkOrganizationId: v.string(),
		clerkOrganizationMembershipId: v.string(),
		clerkUserId: v.string(),
	}),
	v.object({
		type: v.literal("organization.deleted"),
		clerkOrganizationId: v.string(),
	}),
	v.object({ type: v.literal("user.deleted"), clerkUserId: v.string() }),
);

export const process = internalMutation({
	args: {
		occurredAt: v.number(),
		event: clerkLifecycleEventValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await processClerkLifecycleEvent(ctx, args);
		return null;
	},
});

export const purgeOrganizationMembership = internalMutation({
	args: { clerkOrganizationMembershipId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await purgeOrganizationMemberships(ctx, args.clerkOrganizationMembershipId);
		return null;
	},
});

export const clearRevocation = internalMutation({
	args: {
		clerkOrganizationId: v.string(),
		clerkUserId: v.string(),
		revokedAt: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await clearOrganizationMembershipRevocation(ctx, args);
		return null;
	},
});

export const purgeOrganization = internalMutation({
	args: { clerkOrganizationId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await purgeOrganizationModel(ctx, args.clerkOrganizationId);
		return null;
	},
});

export const purgeUser = internalMutation({
	args: { clerkUserId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await purgeUserModel(ctx, args.clerkUserId);
		return null;
	},
});

export const clearDeletedUser = internalMutation({
	args: { clerkUserId: v.string(), deletedAt: v.number() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await clearDeletedUserModel(ctx, args);
		return null;
	},
});
