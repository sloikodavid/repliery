"use node";

import { createClerkClient } from "@clerk/backend";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, env } from "./_generated/server";

export const add = action({
	args: {
		businessId: v.id("businesses"),
		clerkOrganizationMembershipId: v.string(),
		clerkUserId: v.string(),
	},
	returns: v.id("businessMemberships"),
	handler: async (ctx, args): Promise<Id<"businessMemberships">> => {
		const authorization: {
			clerkOrganizationId: string;
			issuer: string;
		} = await ctx.runQuery(internal.businessMemberships.authorizeAdd, {
			businessId: args.businessId,
		});
		const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
		const membershipPage =
			await clerkClient.organizations.getOrganizationMembershipList({
				organizationId: authorization.clerkOrganizationId,
				userId: [args.clerkUserId],
				limit: 1,
			});
		const membership = membershipPage.data[0];
		if (
			!membership ||
			membership.id !== args.clerkOrganizationMembershipId ||
			membership.publicUserData?.userId !== args.clerkUserId
		) {
			throw new ConvexError({ code: "ORGANIZATION_MEMBERSHIP_NOT_FOUND" });
		}

		return await ctx.runMutation(internal.businessMemberships.addValidated, {
			...args,
			clerkUserTokenIdentifier: `${authorization.issuer}|${args.clerkUserId}`,
		});
	},
});
