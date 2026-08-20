/// <reference types="vite/client" />

import type { UserIdentity } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import { clerkPermissions, hasClerkPermission } from "./model/auth";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("compact Clerk permissions use arbitrary-width bitmaps", () => {
	const permissionNames = Array.from({ length: 36 }, (_, index) =>
		index === 35 ? "manage" : `permission_${index}`,
	);
	const compactIdentity = {
		issuer: "https://clerk.example.test",
		subject: "user_admin",
		tokenIdentifier: "https://clerk.example.test|user_admin",
		fea: "o:businesses",
		o: {
			id: "org_one",
			per: permissionNames.join(","),
			fpm: (BigInt(1) << BigInt(35)).toString(),
		},
	} as UserIdentity;
	expect(
		hasClerkPermission(compactIdentity, clerkPermissions.manageBusinesses),
	).toBe(true);
});

test("deprecated Clerk session token claims are not accepted", () => {
	const deprecatedIdentity = {
		issuer: "https://clerk.example.test",
		subject: "user_admin",
		tokenIdentifier: "https://clerk.example.test|user_admin",
		org_id: "org_one",
		org_permissions: [clerkPermissions.manageBusinesses],
	} as UserIdentity;
	expect(
		hasClerkPermission(deprecatedIdentity, clerkPermissions.manageBusinesses),
	).toBe(false);
});

function identity({
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

describe("organization and business authorization", () => {
	test("a manager can access every Business only in the active Organization", async () => {
		const t = convexTest(schema, modules);
		const { localBusinessId, otherBusinessId } = await t.run(async (ctx) => {
			const localBusinessId = await ctx.db.insert("businesses", {
				name: "Local business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			const otherBusinessId = await ctx.db.insert("businesses", {
				name: "Other business",
				clerkOrganizationId: "org_two",
				status: "active",
				updatedAt: 1,
			});
			return { localBusinessId, otherBusinessId };
		});
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses", "business_memberships"],
			}),
		);

		await expect(
			manager.query(api.businesses.get, { businessId: localBusinessId }),
		).resolves.toMatchObject({ name: "Local business" });
		await expect(
			manager.query(api.businesses.get, { businessId: otherBusinessId }),
		).rejects.toThrow();
	});

	test("a regular member can access only explicitly added Businesses", async () => {
		const t = convexTest(schema, modules);
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const { accessibleBusinessId, inaccessibleBusinessId } = await t.run(
			async (ctx) => {
				const accessibleBusinessId = await ctx.db.insert("businesses", {
					name: "Accessible",
					clerkOrganizationId: "org_one",
					status: "active",
					updatedAt: 1,
				});
				const inaccessibleBusinessId = await ctx.db.insert("businesses", {
					name: "Inaccessible",
					clerkOrganizationId: "org_one",
					status: "active",
					updatedAt: 1,
				});
				await ctx.db.insert("businessMemberships", {
					businessId: accessibleBusinessId,
					clerkOrganizationId: "org_one",
					clerkOrganizationMembershipId: "orgmem_member",
					clerkUserId: "user_member",
					clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
				});
				return { accessibleBusinessId, inaccessibleBusinessId };
			},
		);
		const member = t.withIdentity(memberIdentity);

		await expect(
			member.query(api.businesses.get, { businessId: accessibleBusinessId }),
		).resolves.toMatchObject({ name: "Accessible" });
		await expect(
			member.query(api.businesses.get, { businessId: inaccessibleBusinessId }),
		).rejects.toThrow();
	});

	test("Business search stays inside the active Organization and member access boundary", async () => {
		const t = convexTest(schema, modules);
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		await t.run(async (ctx) => {
			const accessibleBusinessId = await ctx.db.insert("businesses", {
				name: "Northwind Dental",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businesses", {
				name: "Northwind Private",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businesses", {
				name: "Northwind Other Organization",
				clerkOrganizationId: "org_two",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businessMemberships", {
				businessId: accessibleBusinessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
			});
		});
		const paginationOpts = { cursor: null, numItems: 20 };
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses", "business_memberships"],
			}),
		);
		const member = t.withIdentity(memberIdentity);

		const managerResults = await manager.query(api.businesses.list, {
			paginationOpts,
			search: "Northwind",
			sort: "newest",
		});
		expect(managerResults.page.map((business) => business.name).sort()).toEqual(
			["Northwind Dental", "Northwind Private"],
		);
		await expect(
			member.query(api.businesses.list, {
				paginationOpts,
				search: "Northwind",
				sort: "newest",
			}),
		).resolves.toMatchObject({
			page: [{ name: "Northwind Dental" }],
		});
	});

	test("Business list ordering follows the requested creation order", async () => {
		const t = convexTest(schema, modules);
		await t.run(async (ctx) => {
			await ctx.db.insert("businesses", {
				name: "Older business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businesses", {
				name: "Newer business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 2,
			});
		});
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses"],
			}),
		);
		const paginationOpts = { cursor: null, numItems: 20 };
		const [newest, oldest] = await Promise.all([
			manager.query(api.businesses.list, {
				paginationOpts,
				search: "",
				sort: "newest",
			}),
			manager.query(api.businesses.list, {
				paginationOpts,
				search: "",
				sort: "oldest",
			}),
		]);

		expect(newest.page.map((business) => business.name)).toEqual([
			"Newer business",
			"Older business",
		]);
		expect(oldest.page.map((business) => business.name)).toEqual([
			"Older business",
			"Newer business",
		]);
	});

	test("Business creation and Business Membership management require their Clerk permissions", async () => {
		const t = convexTest(schema, modules);
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const businessId = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert("businesses", {
				name: "Assigned business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businessMemberships", {
				businessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
			});
			return businessId;
		});
		const member = t.withIdentity(memberIdentity);

		await expect(
			member.mutation(api.businesses.create, { name: "Forbidden" }),
		).rejects.toThrow();
		await expect(
			member.query(api.businessMemberships.list, {
				businessId,
				paginationOpts: { cursor: null, numItems: 20 },
			}),
		).rejects.toThrow();
	});

	test("navigation counts only Business Memberships in the active Organization", async () => {
		const t = convexTest(schema, modules);
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const localBusinessId = await t.run(async (ctx) => {
			const localBusinessId = await ctx.db.insert("businesses", {
				name: "Local business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			const otherBusinessId = await ctx.db.insert("businesses", {
				name: "Other business",
				clerkOrganizationId: "org_two",
				status: "active",
				updatedAt: 1,
			});
			for (const [businessId, organizationId, membershipId] of [
				[localBusinessId, "org_one", "orgmem_local"],
				[otherBusinessId, "org_two", "orgmem_other"],
			] as const) {
				await ctx.db.insert("businessMemberships", {
					businessId,
					clerkOrganizationId: organizationId,
					clerkOrganizationMembershipId: membershipId,
					clerkUserId: "user_member",
					clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
				});
			}
			return localBusinessId;
		});
		const member = t.withIdentity(memberIdentity);

		await expect(
			member.query(api.businesses.navigation, {
				clerkOrganizationId: "org_one",
			}),
		).resolves.toEqual({
			kind: "business",
			businessId: localBusinessId,
			businessName: "Local business",
		});
	});

	test("navigation waits for the Clerk token to match the selected Organization", async () => {
		const t = convexTest(schema, modules);
		const personalSession = t.withIdentity({
			subject: "user_member",
			issuer: "https://clerk.example.test",
			tokenIdentifier: "https://clerk.example.test|user_member",
		});
		const previousOrganization = t.withIdentity(
			identity({ organizationId: "org_one", userId: "user_member" }),
		);

		await expect(
			personalSession.query(api.businesses.navigation, {
				clerkOrganizationId: "org_two",
			}),
		).resolves.toBeNull();
		await expect(
			previousOrganization.query(api.businesses.navigation, {
				clerkOrganizationId: "org_two",
			}),
		).resolves.toBeNull();
	});

	test("a Conversation ID cannot be paired with another Business ID", async () => {
		const t = convexTest(schema, modules);
		const { firstBusinessId, secondBusinessId, conversationId } = await t.run(
			async (ctx) => {
				const firstBusinessId = await ctx.db.insert("businesses", {
					name: "First",
					clerkOrganizationId: "org_one",
					status: "active",
					updatedAt: 1,
				});
				const secondBusinessId = await ctx.db.insert("businesses", {
					name: "Second",
					clerkOrganizationId: "org_one",
					status: "active",
					updatedAt: 1,
				});
				const conversationId = await ctx.db.insert("conversations", {
					businessId: firstBusinessId,
				});
				return { firstBusinessId, secondBusinessId, conversationId };
			},
		);
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses"],
			}),
		);

		await expect(
			manager.query(api.conversations.get, {
				businessId: firstBusinessId,
				conversationId,
			}),
		).resolves.toMatchObject({ businessId: firstBusinessId });
		await expect(
			manager.query(api.conversations.get, {
				businessId: secondBusinessId,
				conversationId,
			}),
		).rejects.toThrow();
	});

	test("membership deletion immediately revokes Business access", async () => {
		const t = convexTest(schema, modules);
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const businessId = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businessMemberships", {
				businessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
			});
			return businessId;
		});
		const member = t.withIdentity(memberIdentity);
		await expect(
			member.query(api.businesses.get, { businessId }),
		).resolves.toBeDefined();

		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: {
				type: "organizationMembership.deleted",
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
			},
		});

		await expect(
			member.query(api.businesses.get, { businessId }),
		).rejects.toThrow();
	});

	test("an out-of-order membership deletion does not remove a newer Business Membership", async () => {
		const t = convexTest(schema, modules);
		const occurredAt = 1_000;
		const businessId = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("businessMemberships", {
				businessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_new",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: "https://clerk.example.test|user_member",
			});
			return businessId;
		});

		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt,
			event: {
				type: "organizationMembership.deleted",
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_old",
				clerkUserId: "user_member",
			},
		});
		await t.mutation(internal.clerkWebhooks.purgeOrganizationMembership, {
			clerkOrganizationMembershipId: "orgmem_old",
		});

		await expect(
			t.run((ctx) =>
				ctx.db
					.query("businessMemberships")
					.withIndex("by_businessId", (queryBuilder) =>
						queryBuilder.eq("businessId", businessId),
					)
					.unique(),
			),
		).resolves.toMatchObject({ clerkOrganizationMembershipId: "orgmem_new" });
		await expect(
			t
				.withIdentity(
					identity({ organizationId: "org_one", userId: "user_member" }),
				)
				.query(api.businesses.get, { businessId }),
		).resolves.toMatchObject({ name: "Business" });
	});

	test("a removed Clerk Organization Membership cannot be assigned during a webhook race", async () => {
		const t = convexTest(schema, modules);
		const businessId = await t.run((ctx) =>
			ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			}),
		);
		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: {
				type: "organizationMembership.deleted",
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_removed",
				clerkUserId: "user_member",
			},
		});
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses", "business_memberships"],
			}),
		);

		await expect(
			manager.mutation(internal.businessMemberships.addValidated, {
				businessId,
				clerkOrganizationMembershipId: "orgmem_removed",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: "https://clerk.example.test|user_member",
			}),
		).rejects.toThrow();
	});

	test("user deletion immediately revokes permission-based Business access", async () => {
		const t = convexTest(schema, modules);
		const businessId = await t.run((ctx) =>
			ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			}),
		);
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses"],
			}),
		);

		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: {
				type: "user.deleted",
				clerkUserId: "user_admin",
			},
		});

		await expect(
			manager.query(api.businesses.get, { businessId }),
		).rejects.toThrow();
	});

	test("Organization deletion creates an immediate authorization tombstone", async () => {
		const t = convexTest(schema, modules);
		const businessId = await t.run((ctx) =>
			ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			}),
		);
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses"],
			}),
		);
		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: {
				type: "organization.deleted",
				clerkOrganizationId: "org_one",
			},
		});

		await expect(
			manager.query(api.businesses.get, { businessId }),
		).rejects.toThrow();
	});

	test("Business deletion purges its Conversations and Business Memberships", async () => {
		const t = convexTest(schema, modules);
		const { businessId } = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("conversations", { businessId });
			await ctx.db.insert("businessMemberships", {
				businessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: "https://clerk.example.test|user_member",
			});
			return { businessId };
		});
		const manager = t.withIdentity(
			identity({
				organizationId: "org_one",
				userId: "user_admin",
				permissions: ["businesses"],
			}),
		);

		await manager.mutation(api.businesses.remove, { businessId });
		await expect(
			manager.query(api.businesses.get, { businessId }),
		).rejects.toThrow();
		await t.mutation(internal.businesses.purge, { businessId });
		await expect(
			t.run((ctx) => ctx.db.get("businesses", businessId)),
		).resolves.toBeNull();
		await expect(
			t.run((ctx) => ctx.db.query("conversations").collect()),
		).resolves.toEqual([]);
		await expect(
			t.run((ctx) => ctx.db.query("businessMemberships").collect()),
		).resolves.toEqual([]);
	});

	test("Organization and user deletion workflows purge owned access records", async () => {
		const t = convexTest(schema, modules);
		const { businessId } = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert("businesses", {
				name: "Business",
				clerkOrganizationId: "org_one",
				status: "active",
				updatedAt: 1,
			});
			await ctx.db.insert("conversations", { businessId });
			await ctx.db.insert("businessMemberships", {
				businessId,
				clerkOrganizationId: "org_one",
				clerkOrganizationMembershipId: "orgmem_member",
				clerkUserId: "user_member",
				clerkUserTokenIdentifier: "https://clerk.example.test|user_member",
			});
			return { businessId };
		});

		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: { type: "user.deleted", clerkUserId: "user_member" },
		});
		await t.mutation(internal.clerkWebhooks.purgeUser, {
			clerkUserId: "user_member",
		});
		await expect(
			t.run((ctx) => ctx.db.query("businessMemberships").collect()),
		).resolves.toEqual([]);

		await t.mutation(internal.clerkWebhooks.process, {
			occurredAt: Date.now(),
			event: { type: "organization.deleted", clerkOrganizationId: "org_one" },
		});
		await t.mutation(internal.clerkWebhooks.purgeOrganization, {
			clerkOrganizationId: "org_one",
		});
		await t.mutation(internal.businesses.purge, { businessId });
		await expect(
			t.run((ctx) => ctx.db.get("businesses", businessId)),
		).resolves.toBeNull();
		await expect(
			t.run((ctx) => ctx.db.query("conversations").collect()),
		).resolves.toEqual([]);
		await expect(
			t.run((ctx) => ctx.db.query("deletedOrganizations").collect()),
		).resolves.toHaveLength(1);
	});
});
