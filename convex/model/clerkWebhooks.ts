import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

const CLERK_SESSION_TOKEN_LIFETIME_MS = 60_000;
const CLERK_TOKEN_CLOCK_SKEW_MS = 5_000;
const CLERK_SESSION_TOKEN_STALENESS_WINDOW_MS =
	CLERK_SESSION_TOKEN_LIFETIME_MS + CLERK_TOKEN_CLOCK_SKEW_MS;

export type ClerkLifecycleEvent =
	| {
			type: "organizationMembership.deleted";
			clerkOrganizationId: string;
			clerkOrganizationMembershipId: string;
			clerkUserId: string;
	  }
	| { type: "organization.deleted"; clerkOrganizationId: string }
	| { type: "user.deleted"; clerkUserId: string };

export async function processClerkLifecycleEvent(
	ctx: MutationCtx,
	args: { occurredAt: number; event: ClerkLifecycleEvent },
) {
	if (args.event.type === "organizationMembership.deleted")
		await recordOrganizationMembershipRevocation(
			ctx,
			args.event,
			args.occurredAt,
		);
	if (args.event.type === "organization.deleted")
		await recordOrganizationDeletion(ctx, args.event, args.occurredAt);
	if (args.event.type === "user.deleted")
		await recordUserDeletion(ctx, args.event, args.occurredAt);
}

async function recordOrganizationMembershipRevocation(
	ctx: MutationCtx,
	event: Extract<
		ClerkLifecycleEvent,
		{ type: "organizationMembership.deleted" }
	>,
	occurredAt: number,
) {
	const now = Date.now();
	const staleUntil = occurredAt + CLERK_SESSION_TOKEN_STALENESS_WINDOW_MS;
	const existing = await ctx.db
		.query("revokedOrganizationMembers")
		.withIndex("by_clerkOrganizationId_and_clerkUserId", (query) =>
			query
				.eq("clerkOrganizationId", event.clerkOrganizationId)
				.eq("clerkUserId", event.clerkUserId),
		)
		.unique();
	if (existing && occurredAt > existing.revokedAt) {
		await ctx.db.patch("revokedOrganizationMembers", existing._id, {
			clerkOrganizationMembershipId: event.clerkOrganizationMembershipId,
			revokedAt: occurredAt,
		});
	} else if (!existing && staleUntil > now) {
		await ctx.db.insert("revokedOrganizationMembers", {
			clerkOrganizationId: event.clerkOrganizationId,
			clerkOrganizationMembershipId: event.clerkOrganizationMembershipId,
			clerkUserId: event.clerkUserId,
			revokedAt: occurredAt,
		});
	}
	await ctx.scheduler.runAfter(
		0,
		internal.clerkWebhooks.purgeOrganizationMembership,
		{ clerkOrganizationMembershipId: event.clerkOrganizationMembershipId },
	);
	if (staleUntil > now && (!existing || occurredAt > existing.revokedAt))
		await ctx.scheduler.runAfter(
			staleUntil - now,
			internal.clerkWebhooks.clearRevocation,
			{
				clerkOrganizationId: event.clerkOrganizationId,
				clerkUserId: event.clerkUserId,
				revokedAt: occurredAt,
			},
		);
}

async function recordOrganizationDeletion(
	ctx: MutationCtx,
	event: Extract<ClerkLifecycleEvent, { type: "organization.deleted" }>,
	occurredAt: number,
) {
	const existing = await ctx.db
		.query("deletedOrganizations")
		.withIndex("by_clerkOrganizationId", (query) =>
			query.eq("clerkOrganizationId", event.clerkOrganizationId),
		)
		.unique();
	if (!existing)
		await ctx.db.insert("deletedOrganizations", {
			clerkOrganizationId: event.clerkOrganizationId,
			deletedAt: occurredAt,
		});
	await ctx.scheduler.runAfter(0, internal.clerkWebhooks.purgeOrganization, {
		clerkOrganizationId: event.clerkOrganizationId,
	});
}

async function recordUserDeletion(
	ctx: MutationCtx,
	event: Extract<ClerkLifecycleEvent, { type: "user.deleted" }>,
	occurredAt: number,
) {
	const now = Date.now();
	const staleUntil = occurredAt + CLERK_SESSION_TOKEN_STALENESS_WINDOW_MS;
	const existing = await ctx.db
		.query("deletedUsers")
		.withIndex("by_clerkUserId", (query) =>
			query.eq("clerkUserId", event.clerkUserId),
		)
		.unique();
	if (!existing && staleUntil > now)
		await ctx.db.insert("deletedUsers", {
			clerkUserId: event.clerkUserId,
			deletedAt: occurredAt,
		});
	await ctx.scheduler.runAfter(0, internal.clerkWebhooks.purgeUser, {
		clerkUserId: event.clerkUserId,
	});
	if (!existing && staleUntil > now)
		await ctx.scheduler.runAfter(
			staleUntil - now,
			internal.clerkWebhooks.clearDeletedUser,
			{
				clerkUserId: event.clerkUserId,
				deletedAt: occurredAt,
			},
		);
}

export async function purgeOrganizationMemberships(
	ctx: MutationCtx,
	clerkOrganizationMembershipId: string,
) {
	const memberships = await ctx.db
		.query("businessMemberships")
		.withIndex("by_clerkOrganizationMembershipId", (query) =>
			query.eq("clerkOrganizationMembershipId", clerkOrganizationMembershipId),
		)
		.take(100);
	for (const membership of memberships)
		await ctx.db.delete("businessMemberships", membership._id);
	if (memberships.length === 100)
		await ctx.scheduler.runAfter(
			0,
			internal.clerkWebhooks.purgeOrganizationMembership,
			{ clerkOrganizationMembershipId },
		);
}

export async function clearOrganizationMembershipRevocation(
	ctx: MutationCtx,
	args: { clerkOrganizationId: string; clerkUserId: string; revokedAt: number },
) {
	const revocation = await ctx.db
		.query("revokedOrganizationMembers")
		.withIndex("by_clerkOrganizationId_and_clerkUserId", (query) =>
			query
				.eq("clerkOrganizationId", args.clerkOrganizationId)
				.eq("clerkUserId", args.clerkUserId),
		)
		.unique();
	if (revocation?.revokedAt === args.revokedAt)
		await ctx.db.delete("revokedOrganizationMembers", revocation._id);
}

export async function purgeOrganization(
	ctx: MutationCtx,
	clerkOrganizationId: string,
) {
	const businesses = await ctx.db
		.query("businesses")
		.withIndex("by_clerkOrganizationId_and_status", (query) =>
			query
				.eq("clerkOrganizationId", clerkOrganizationId)
				.eq("status", "active"),
		)
		.take(25);
	for (const business of businesses) {
		await ctx.db.patch("businesses", business._id, {
			status: "deleting",
		});
		await ctx.scheduler.runAfter(0, internal.businesses.purge, {
			businessId: business._id,
		});
	}
	const memberships = await ctx.db
		.query("businessMemberships")
		.withIndex("by_clerkOrganizationId_and_clerkUserId", (query) =>
			query.eq("clerkOrganizationId", clerkOrganizationId),
		)
		.take(100);
	for (const membership of memberships)
		await ctx.db.delete("businessMemberships", membership._id);
	if (businesses.length === 25 || memberships.length === 100)
		await ctx.scheduler.runAfter(0, internal.clerkWebhooks.purgeOrganization, {
			clerkOrganizationId,
		});
}

export async function purgeUser(ctx: MutationCtx, clerkUserId: string) {
	const memberships = await ctx.db
		.query("businessMemberships")
		.withIndex("by_clerkUserId", (query) =>
			query.eq("clerkUserId", clerkUserId),
		)
		.take(100);
	for (const membership of memberships)
		await ctx.db.delete("businessMemberships", membership._id);
	if (memberships.length === 100)
		await ctx.scheduler.runAfter(0, internal.clerkWebhooks.purgeUser, {
			clerkUserId,
		});
}

export async function clearDeletedUser(
	ctx: MutationCtx,
	args: { clerkUserId: string; deletedAt: number },
) {
	const tombstone = await ctx.db
		.query("deletedUsers")
		.withIndex("by_clerkUserId", (query) =>
			query.eq("clerkUserId", args.clerkUserId),
		)
		.unique();
	if (tombstone?.deletedAt === args.deletedAt)
		await ctx.db.delete("deletedUsers", tombstone._id);
}
