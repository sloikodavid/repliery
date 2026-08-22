import type { PaginationOptions } from "convex/server";
import { ConvexError } from "convex/values";
import {
	type BusinessSort,
	businessSorts,
} from "../../shared/business-contract";
import { clerkPermissions } from "../../shared/clerk-contract";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	type ClerkPermission,
	getActiveOrganizationIdentityOrNull,
	hasClerkPermission,
	requireOrganizationIdentity,
	requirePermission,
} from "./auth";

type DatabaseContext = Pick<QueryCtx | MutationCtx, "auth" | "db">;

export async function requireBusinessAccess(
	ctx: DatabaseContext,
	businessId: Id<"businesses">,
) {
	const organizationIdentity = await requireOrganizationIdentity(ctx);
	const business = await ctx.db.get("businesses", businessId);
	if (
		business?.status !== "active" ||
		business.clerkOrganizationId !== organizationIdentity.clerkOrganizationId
	) {
		throw new ConvexError({ code: "NOT_FOUND" });
	}

	if (
		hasClerkPermission(
			organizationIdentity.identity,
			clerkPermissions.manageBusinesses,
		)
	) {
		return { business, organizationIdentity };
	}

	const membership = await ctx.db
		.query("businessMemberships")
		.withIndex("by_businessId_and_clerkUserTokenIdentifier", (query) =>
			query
				.eq("businessId", businessId)
				.eq(
					"clerkUserTokenIdentifier",
					organizationIdentity.clerkUserTokenIdentifier,
				),
		)
		.unique();
	if (!membership) {
		throw new ConvexError({ code: "NOT_FOUND" });
	}

	return { business, organizationIdentity };
}

export async function requireBusinessPermission(
	ctx: DatabaseContext,
	businessId: Id<"businesses">,
	permission: ClerkPermission,
) {
	const access = await requireBusinessAccess(ctx, businessId);
	if (!hasClerkPermission(access.organizationIdentity.identity, permission)) {
		throw new ConvexError({ code: "FORBIDDEN" });
	}
	return access;
}

export async function requireBusinessMembershipManagement(
	ctx: DatabaseContext,
	businessId: Id<"businesses">,
) {
	return requireBusinessPermission(
		ctx,
		businessId,
		clerkPermissions.manageBusinessMemberships,
	);
}

export async function requireConversationAccess(
	ctx: DatabaseContext,
	businessId: Id<"businesses">,
	conversationId: Id<"conversations">,
) {
	const access = await requireBusinessAccess(ctx, businessId);
	const conversation = await ctx.db.get("conversations", conversationId);
	if (!conversation || conversation.businessId !== businessId) {
		throw new ConvexError({ code: "NOT_FOUND" });
	}
	return { ...access, conversation };
}

export async function getBusinessNavigation(
	ctx: QueryCtx,
	expectedClerkOrganizationId: string,
) {
	const organizationIdentity = await getActiveOrganizationIdentityOrNull(
		ctx,
		expectedClerkOrganizationId,
	);
	if (!organizationIdentity) {
		return null;
	}
	if (
		hasClerkPermission(
			organizationIdentity.identity,
			clerkPermissions.manageBusinesses,
		)
	) {
		return { kind: "businesses" as const };
	}

	const memberships = await ctx.db
		.query("businessMemberships")
		.withIndex("by_clerkUserTokenIdentifier_and_clerkOrganizationId", (query) =>
			query
				.eq(
					"clerkUserTokenIdentifier",
					organizationIdentity.clerkUserTokenIdentifier,
				)
				.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId),
		)
		.take(2);

	if (memberships.length !== 1) {
		return { kind: "businesses" as const };
	}

	const business = await ctx.db.get("businesses", memberships[0].businessId);
	if (
		business?.status !== "active" ||
		business.clerkOrganizationId !== organizationIdentity.clerkOrganizationId
	) {
		return { kind: "businesses" as const };
	}

	return {
		kind: "business" as const,
		businessId: business._id,
		businessName: business.name,
	};
}

export async function listBusinesses(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	searchInput: string,
	sort: BusinessSort,
) {
	const organizationIdentity = await requireOrganizationIdentity(ctx);
	const canManageBusinesses = hasClerkPermission(
		organizationIdentity.identity,
		clerkPermissions.manageBusinesses,
	);
	const search = searchInput
		.trim()
		.split(/\s+/)
		.slice(0, 16)
		.join(" ")
		.slice(0, 80);
	if (canManageBusinesses && search) {
		return await ctx.db
			.query("businesses")
			.withSearchIndex(
				"search_name_and_clerkOrganizationId_and_status",
				(query) =>
					query
						.search("name", search)
						.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId)
						.eq("status", "active"),
			)
			.paginate(paginationOpts);
	}
	if (canManageBusinesses) {
		return await ctx.db
			.query("businesses")
			.withIndex("by_clerkOrganizationId_and_status", (query) =>
				query
					.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId)
					.eq("status", "active"),
			)
			.order(sort === businessSorts.newest ? "desc" : "asc")
			.paginate(paginationOpts);
	}

	const membershipPage = await ctx.db
		.query("businessMemberships")
		.withIndex("by_clerkUserTokenIdentifier_and_clerkOrganizationId", (query) =>
			query
				.eq(
					"clerkUserTokenIdentifier",
					organizationIdentity.clerkUserTokenIdentifier,
				)
				.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId),
		)
		.order(sort === businessSorts.newest ? "desc" : "asc")
		.paginate(paginationOpts);
	const businesses = await Promise.all(
		membershipPage.page.map((membership) =>
			ctx.db.get("businesses", membership.businessId),
		),
	);
	return {
		...membershipPage,
		page: businesses.filter(
			(business): business is NonNullable<typeof business> =>
				business?.status === "active" &&
				business.clerkOrganizationId ===
					organizationIdentity.clerkOrganizationId,
		),
	};
}

export async function getBusiness(ctx: QueryCtx, businessId: Id<"businesses">) {
	const { business } = await requireBusinessAccess(ctx, businessId);
	return business;
}

export async function createBusiness(ctx: MutationCtx, nameInput: string) {
	const organizationIdentity = await requirePermission(
		ctx,
		clerkPermissions.manageBusinesses,
	);
	const name = nameInput.trim();
	if (name.length < 1 || name.length > 80) {
		throw new ConvexError({ code: "INVALID_BUSINESS_NAME" });
	}
	return await ctx.db.insert("businesses", {
		name,
		clerkOrganizationId: organizationIdentity.clerkOrganizationId,
		status: "active",
	});
}

export async function requestBusinessDeletion(
	ctx: MutationCtx,
	businessId: Id<"businesses">,
) {
	const { business } = await requireBusinessPermission(
		ctx,
		businessId,
		clerkPermissions.manageBusinesses,
	);
	if (business.status === "active") {
		await ctx.db.patch("businesses", business._id, {
			status: "deleting",
		});
		await ctx.scheduler.runAfter(0, internal.businesses.purge, {
			businessId: business._id,
		});
	}
}

export async function purgeBusiness(
	ctx: MutationCtx,
	businessId: Id<"businesses">,
) {
	const business = await ctx.db.get("businesses", businessId);
	if (business?.status !== "deleting") {
		return;
	}

	const conversations = await ctx.db
		.query("conversations")
		.withIndex("by_businessId", (query) => query.eq("businessId", businessId))
		.take(100);
	for (const conversation of conversations) {
		await ctx.db.delete("conversations", conversation._id);
	}
	if (conversations.length === 100) {
		await ctx.scheduler.runAfter(0, internal.businesses.purge, { businessId });
		return;
	}

	const memberships = await ctx.db
		.query("businessMemberships")
		.withIndex("by_businessId", (query) => query.eq("businessId", businessId))
		.take(100);
	for (const membership of memberships) {
		await ctx.db.delete("businessMemberships", membership._id);
	}
	if (memberships.length === 100) {
		await ctx.scheduler.runAfter(0, internal.businesses.purge, { businessId });
		return;
	}

	await ctx.db.delete("businesses", business._id);
}
