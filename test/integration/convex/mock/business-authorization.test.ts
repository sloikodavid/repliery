import { describe, expect, test } from "vitest";
import { api } from "../../../../convex/_generated/api";
import {
	businessFields,
	businessMembershipFields,
	createConvexTest,
	identity,
} from "../../../support/integration/convex/mock/fixtures";

describe("business authorization", () => {
	test("a manager can access every Business only in the active Organization", async () => {
		const t = createConvexTest();
		const { localBusinessId, otherBusinessId } = await t.run(async (ctx) => {
			const localBusinessId = await ctx.db.insert(
				"businesses",
				businessFields({ name: "Local business" }),
			);
			const otherBusinessId = await ctx.db.insert(
				"businesses",
				businessFields({
					name: "Other business",
					clerkOrganizationId: "org_two",
				}),
			);
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
		const t = createConvexTest();
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const { accessibleBusinessId, inaccessibleBusinessId } = await t.run(
			async (ctx) => {
				const accessibleBusinessId = await ctx.db.insert(
					"businesses",
					businessFields({ name: "Accessible" }),
				);
				const inaccessibleBusinessId = await ctx.db.insert(
					"businesses",
					businessFields({ name: "Inaccessible" }),
				);
				await ctx.db.insert(
					"businessMemberships",
					businessMembershipFields(accessibleBusinessId, {
						clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
					}),
				);
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
		const t = createConvexTest();
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		await t.run(async (ctx) => {
			const accessibleBusinessId = await ctx.db.insert(
				"businesses",
				businessFields({ name: "Northwind Dental" }),
			);
			await ctx.db.insert(
				"businesses",
				businessFields({ name: "Northwind Private" }),
			);
			await ctx.db.insert(
				"businesses",
				businessFields({
					name: "Northwind Other Organization",
					clerkOrganizationId: "org_two",
				}),
			);
			await ctx.db.insert(
				"businessMemberships",
				businessMembershipFields(accessibleBusinessId, {
					clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
				}),
			);
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
		const t = createConvexTest();
		await t.run(async (ctx) => {
			await ctx.db.insert(
				"businesses",
				businessFields({ name: "Older business" }),
			);
			await ctx.db.insert(
				"businesses",
				businessFields({ name: "Newer business" }),
			);
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
		const t = createConvexTest();
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const businessId = await t.run(async (ctx) => {
			const businessId = await ctx.db.insert(
				"businesses",
				businessFields({ name: "Assigned business" }),
			);
			await ctx.db.insert(
				"businessMemberships",
				businessMembershipFields(businessId, {
					clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
				}),
			);
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
		const t = createConvexTest();
		const memberIdentity = identity({
			organizationId: "org_one",
			userId: "user_member",
		});
		const localBusinessId = await t.run(async (ctx) => {
			const localBusinessId = await ctx.db.insert(
				"businesses",
				businessFields({ name: "Local business" }),
			);
			const otherBusinessId = await ctx.db.insert(
				"businesses",
				businessFields({
					name: "Other business",
					clerkOrganizationId: "org_two",
				}),
			);
			for (const [
				businessId,
				clerkOrganizationId,
				clerkOrganizationMembershipId,
			] of [
				[localBusinessId, "org_one", "orgmem_local"],
				[otherBusinessId, "org_two", "orgmem_other"],
			] as const) {
				await ctx.db.insert(
					"businessMemberships",
					businessMembershipFields(businessId, {
						clerkOrganizationId,
						clerkOrganizationMembershipId,
						clerkUserTokenIdentifier: memberIdentity.tokenIdentifier ?? "",
					}),
				);
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
		const t = createConvexTest();
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
		const t = createConvexTest();
		const { firstBusinessId, secondBusinessId, conversationId } = await t.run(
			async (ctx) => {
				const firstBusinessId = await ctx.db.insert(
					"businesses",
					businessFields({ name: "First" }),
				);
				const secondBusinessId = await ctx.db.insert(
					"businesses",
					businessFields({ name: "Second" }),
				);
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
});
