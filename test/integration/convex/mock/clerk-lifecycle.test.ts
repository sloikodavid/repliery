import { expect, test } from "vitest";
import { api, internal } from "../../../../convex/_generated/api";
import {
	businessFields,
	businessMembershipFields,
	createConvexTest,
	identity,
} from "../../../support/integration/convex/mock/fixtures";

test("user deletion immediately revokes permission-based Business access", async () => {
	const t = createConvexTest();
	const businessId = await t.run((ctx) =>
		ctx.db.insert("businesses", businessFields()),
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
		event: { type: "user.deleted", clerkUserId: "user_admin" },
	});

	await expect(
		manager.query(api.businesses.get, { businessId }),
	).rejects.toThrow();
});

test("Organization deletion creates an immediate authorization tombstone", async () => {
	const t = createConvexTest();
	const businessId = await t.run((ctx) =>
		ctx.db.insert("businesses", businessFields()),
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
	const t = createConvexTest();
	const { businessId } = await t.run(async (ctx) => {
		const businessId = await ctx.db.insert("businesses", businessFields());
		await ctx.db.insert("conversations", { businessId });
		await ctx.db.insert(
			"businessMemberships",
			businessMembershipFields(businessId),
		);
		return { businessId };
	});
	const manager = t.withIdentity(
		identity({
			organizationId: "org_one",
			userId: "user_admin",
			permissions: ["businesses"],
		}),
	);

	await manager.mutation(api.businesses.requestDeletion, { businessId });
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
	const t = createConvexTest();
	const { businessId } = await t.run(async (ctx) => {
		const businessId = await ctx.db.insert("businesses", businessFields());
		await ctx.db.insert("conversations", { businessId });
		await ctx.db.insert(
			"businessMemberships",
			businessMembershipFields(businessId),
		);
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
