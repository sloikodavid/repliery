import { expect, test } from "vitest";
import { api, internal } from "../../../../convex/_generated/api";
import {
	businessFields,
	businessMembershipFields,
	createConvexTest,
	identity,
} from "../../../support/integration/convex/mock/fixtures";

test("membership deletion immediately revokes Business access", async () => {
	const t = createConvexTest();
	const memberIdentity = identity({
		organizationId: "org_one",
		userId: "user_member",
	});
	const businessId = await t.run(async (ctx) => {
		const businessId = await ctx.db.insert("businesses", businessFields());
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
	const t = createConvexTest();
	const occurredAt = 1_000;
	const businessId = await t.run(async (ctx) => {
		const businessId = await ctx.db.insert("businesses", businessFields());
		await ctx.db.insert(
			"businessMemberships",
			businessMembershipFields(businessId, {
				clerkOrganizationMembershipId: "orgmem_new",
			}),
		);
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
	const t = createConvexTest();
	const businessId = await t.run((ctx) =>
		ctx.db.insert("businesses", businessFields()),
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
