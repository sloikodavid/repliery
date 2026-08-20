import type { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { clerkPermissions } from "../clerkContract";

export { clerkPermissions };

export type ClerkPermission =
	(typeof clerkPermissions)[keyof typeof clerkPermissions];

export type OrganizationIdentity = {
	clerkOrganizationId: string;
	clerkUserId: string;
	clerkUserTokenIdentifier: string;
	issuer: string;
	identity: UserIdentity;
};

type AuthContext = Pick<QueryCtx | MutationCtx, "auth">;
type DatabaseContext = Pick<QueryCtx | MutationCtx, "auth" | "db">;

function stringClaim(identity: UserIdentity, key: string) {
	const value = identity[key];
	return typeof value === "string" ? value : null;
}

function objectClaim(identity: UserIdentity, key: string) {
	const value = identity[key];
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? value
		: null;
}

function nestedStringClaim(
	identity: UserIdentity,
	objectKey: string,
	propertyKey: string,
) {
	const value = objectClaim(identity, objectKey)?.[propertyKey];
	return typeof value === "string" ? value : null;
}

function organizationIdentityFromUserIdentity(identity: UserIdentity) {
	const clerkOrganizationId = nestedStringClaim(identity, "o", "id");
	if (!clerkOrganizationId) {
		return null;
	}

	return {
		clerkOrganizationId,
		clerkUserId: identity.subject,
		clerkUserTokenIdentifier: identity.tokenIdentifier,
		issuer: identity.issuer,
		identity,
	} satisfies OrganizationIdentity;
}

async function isOrganizationIdentityRevoked(
	ctx: DatabaseContext,
	organizationIdentity: OrganizationIdentity,
) {
	const [deletedOrganization, deletedUser, revokedMembership] =
		await Promise.all([
			ctx.db
				.query("deletedOrganizations")
				.withIndex("by_clerkOrganizationId", (query) =>
					query.eq(
						"clerkOrganizationId",
						organizationIdentity.clerkOrganizationId,
					),
				)
				.unique(),
			ctx.db
				.query("deletedUsers")
				.withIndex("by_clerkUserId", (query) =>
					query.eq("clerkUserId", organizationIdentity.clerkUserId),
				)
				.unique(),
			ctx.db
				.query("revokedOrganizationMembers")
				.withIndex("by_clerkOrganizationId_and_clerkUserId", (query) =>
					query
						.eq("clerkOrganizationId", organizationIdentity.clerkOrganizationId)
						.eq("clerkUserId", organizationIdentity.clerkUserId),
				)
				.unique(),
		]);

	return Boolean(deletedOrganization || deletedUser || revokedMembership);
}

export function hasClerkPermission(
	identity: UserIdentity,
	permission: ClerkPermission,
) {
	const [, requestedFeature, requestedPermission] = permission.split(":");
	if (!requestedFeature || !requestedPermission) {
		return false;
	}

	const features = stringClaim(identity, "fea")?.split(",") ?? [];
	const permissionNames =
		nestedStringClaim(identity, "o", "per")?.split(",") ?? [];
	const featurePermissionMaps =
		nestedStringClaim(identity, "o", "fpm")?.split(",") ?? [];
	const featureIndex = features.indexOf(`o:${requestedFeature}`);
	const permissionIndex = permissionNames.indexOf(requestedPermission);

	if (featureIndex < 0 || permissionIndex < 0) {
		return false;
	}

	try {
		const permissionMap = BigInt(featurePermissionMaps[featureIndex] ?? "");
		return (
			(permissionMap & (BigInt(1) << BigInt(permissionIndex))) !== BigInt(0)
		);
	} catch {
		return false;
	}
}

export async function getOrganizationIdentity(ctx: AuthContext) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError({ code: "UNAUTHENTICATED" });
	}

	const organizationIdentity = organizationIdentityFromUserIdentity(identity);
	if (!organizationIdentity) {
		throw new ConvexError({ code: "ORGANIZATION_REQUIRED" });
	}

	return organizationIdentity;
}

export async function getActiveOrganizationIdentityOrNull(
	ctx: DatabaseContext,
	expectedClerkOrganizationId: string,
) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return null;
	}

	const organizationIdentity = organizationIdentityFromUserIdentity(identity);
	if (
		!organizationIdentity ||
		organizationIdentity.clerkOrganizationId !== expectedClerkOrganizationId ||
		(await isOrganizationIdentityRevoked(ctx, organizationIdentity))
	) {
		return null;
	}

	return organizationIdentity;
}

export async function requireOrganizationIdentity(ctx: DatabaseContext) {
	const organizationIdentity = await getOrganizationIdentity(ctx);
	if (await isOrganizationIdentityRevoked(ctx, organizationIdentity)) {
		throw new ConvexError({ code: "NOT_FOUND" });
	}

	return organizationIdentity;
}

export async function requirePermission(
	ctx: DatabaseContext,
	permission: ClerkPermission,
) {
	const organizationIdentity = await requireOrganizationIdentity(ctx);
	if (!hasClerkPermission(organizationIdentity.identity, permission)) {
		throw new ConvexError({ code: "FORBIDDEN" });
	}
	return organizationIdentity;
}
