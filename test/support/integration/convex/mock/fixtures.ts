import type { UserIdentity } from "convex/server";
import { convexTest } from "convex-test";
import type { Id } from "../../../../../convex/_generated/dataModel";
import schema from "../../../../../convex/schema";
import { modules } from "./modules";

export function createConvexTest() {
	return convexTest(schema, modules);
}

export function identity({
	organizationId,
	userId,
	permissions = [],
}: {
	organizationId: string;
	userId: string;
	permissions?: Array<"businesses" | "business_memberships">;
}) {
	return {
		subject: userId,
		issuer: "https://clerk.example.test",
		tokenIdentifier: `https://clerk.example.test|${userId}`,
		fea: permissions.map((feature) => `o:${feature}`).join(","),
		o: {
			id: organizationId,
			rol: permissions.length > 0 ? "admin" : "member",
			per: permissions.length > 0 ? "manage" : "",
			fpm: permissions.map(() => "1").join(","),
		},
	} satisfies Partial<UserIdentity>;
}

export function businessFields({
	name = "Business",
	clerkOrganizationId = "org_one",
	status = "active",
}: {
	name?: string;
	clerkOrganizationId?: string;
	status?: "active" | "deleting";
} = {}) {
	return { name, clerkOrganizationId, status };
}

export function businessMembershipFields(
	businessId: Id<"businesses">,
	{
		clerkOrganizationId = "org_one",
		clerkOrganizationMembershipId = "orgmem_member",
		clerkUserId = "user_member",
		clerkUserTokenIdentifier = "https://clerk.example.test|user_member",
	}: {
		clerkOrganizationId?: string;
		clerkOrganizationMembershipId?: string;
		clerkUserId?: string;
		clerkUserTokenIdentifier?: string;
	} = {},
) {
	return {
		businessId,
		clerkOrganizationId,
		clerkOrganizationMembershipId,
		clerkUserId,
		clerkUserTokenIdentifier,
	};
}
