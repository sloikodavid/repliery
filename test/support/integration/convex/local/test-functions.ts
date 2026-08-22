import { v } from "convex/values";
import { internal } from "../../../../../convex/_generated/api";
import { mutation, query } from "../../../../../convex/_generated/server";

export const reset = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const tables = [
			"businessMemberships",
			"conversations",
			"businesses",
			"deletedOrganizations",
			"deletedUsers",
			"revokedOrganizationMembers",
		] as const;
		for (const table of tables) {
			const documents = await ctx.db.query(table).take(1_000);
			for (const document of documents) {
				await ctx.db.delete(table, document._id);
			}
		}
		return null;
	},
});

export const seedBusinesses = mutation({
	args: {
		businesses: v.array(
			v.object({
				clerkOrganizationId: v.string(),
				name: v.string(),
			}),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		for (const business of args.businesses) {
			await ctx.db.insert("businesses", {
				...business,
				status: "active",
			});
		}
		return null;
	},
});

export const startBusinessDeletion = mutation({
	args: { conversationCount: v.number() },
	returns: v.id("businesses"),
	handler: async (ctx, args) => {
		if (
			!Number.isInteger(args.conversationCount) ||
			args.conversationCount < 1 ||
			args.conversationCount > 150
		) {
			throw new Error("Invalid conversation count");
		}
		const businessId = await ctx.db.insert("businesses", {
			clerkOrganizationId: "org_scheduler_probe",
			name: "Scheduled deletion probe",
			status: "deleting",
		});
		for (let index = 0; index < args.conversationCount; index += 1) {
			await ctx.db.insert("conversations", { businessId });
		}
		await ctx.scheduler.runAfter(0, internal.businesses.purge, { businessId });
		return businessId;
	},
});

export const businessDeletionState = query({
	args: { businessId: v.id("businesses") },
	returns: v.object({
		businessExists: v.boolean(),
		conversationCount: v.number(),
	}),
	handler: async (ctx, args) => {
		const [business, conversations] = await Promise.all([
			ctx.db.get("businesses", args.businessId),
			ctx.db
				.query("conversations")
				.withIndex("by_businessId", (index) =>
					index.eq("businessId", args.businessId),
				)
				.take(151),
		]);
		return {
			businessExists: business !== null,
			conversationCount: conversations.length,
		};
	},
});

export const organizationDeletionState = query({
	args: { clerkOrganizationId: v.string() },
	returns: v.array(v.number()),
	handler: async (ctx, args) => {
		const tombstones = await ctx.db
			.query("deletedOrganizations")
			.withIndex("by_clerkOrganizationId", (index) =>
				index.eq("clerkOrganizationId", args.clerkOrganizationId),
			)
			.take(2);
		return tombstones.map((tombstone) => tombstone.deletedAt);
	},
});
