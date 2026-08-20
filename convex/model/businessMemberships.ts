import type { PaginationOptions } from "convex/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireBusinessMembershipManagement } from "./businesses";

export async function listBusinessMemberships(
	ctx: QueryCtx,
	args: {
		businessId: Id<"businesses">;
		paginationOpts: PaginationOptions;
	},
) {
	await requireBusinessMembershipManagement(ctx, args.businessId);
	return await ctx.db
		.query("businessMemberships")
		.withIndex("by_businessId", (query) =>
			query.eq("businessId", args.businessId),
		)
		.order("desc")
		.paginate(args.paginationOpts);
}

export async function authorizeBusinessMembershipAddition(
	ctx: QueryCtx,
	businessId: Id<"businesses">,
) {
	const { organizationIdentity } = await requireBusinessMembershipManagement(
		ctx,
		businessId,
	);
	return {
		clerkOrganizationId: organizationIdentity.clerkOrganizationId,
		issuer: organizationIdentity.issuer,
	};
}

export async function addValidatedBusinessMembership(
	ctx: MutationCtx,
	args: {
		businessId: Id<"businesses">;
		clerkOrganizationMembershipId: string;
		clerkUserId: string;
		clerkUserTokenIdentifier: string;
	},
) {
	const { organizationIdentity } = await requireBusinessMembershipManagement(
		ctx,
		args.businessId,
	);
	const targetRevocation = await ctx.db
		.query("revokedOrganizationMembers")
		.withIndex("by_clerkOrganizationId_and_clerkUserId", (query) =>
			query
				.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId)
				.eq("clerkUserId", args.clerkUserId),
		)
		.unique();
	if (
		targetRevocation?.clerkOrganizationMembershipId ===
		args.clerkOrganizationMembershipId
	) {
		throw new ConvexError({ code: "ORGANIZATION_MEMBERSHIP_NOT_FOUND" });
	}

	const existing = await ctx.db
		.query("businessMemberships")
		.withIndex("by_businessId_and_clerkUserId", (query) =>
			query
				.eq("businessId", args.businessId)
				.eq("clerkUserId", args.clerkUserId),
		)
		.unique();
	if (existing) {
		await ctx.db.patch("businessMemberships", existing._id, {
			clerkOrganizationMembershipId: args.clerkOrganizationMembershipId,
			clerkUserTokenIdentifier: args.clerkUserTokenIdentifier,
		});
		return existing._id;
	}

	return await ctx.db.insert("businessMemberships", {
		businessId: args.businessId,
		clerkOrganizationId: organizationIdentity.clerkOrganizationId,
		clerkOrganizationMembershipId: args.clerkOrganizationMembershipId,
		clerkUserId: args.clerkUserId,
		clerkUserTokenIdentifier: args.clerkUserTokenIdentifier,
	});
}

export async function removeBusinessMembership(
	ctx: MutationCtx,
	args: {
		businessId: Id<"businesses">;
		businessMembershipId: Id<"businessMemberships">;
	},
) {
	await requireBusinessMembershipManagement(ctx, args.businessId);
	const membership = await ctx.db.get(
		"businessMemberships",
		args.businessMembershipId,
	);
	if (membership?.businessId === args.businessId) {
		await ctx.db.delete("businessMemberships", membership._id);
	}
}
