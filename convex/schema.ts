import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	businessFieldsValidator,
	businessMembershipFieldsValidator,
	conversationFieldsValidator,
} from "./validators";

export default defineSchema({
	businesses: defineTable(businessFieldsValidator.fields)
		.index("by_clerkOrganizationId_and_status", [
			"clerkOrganizationId",
			"status",
		])
		.searchIndex("search_name_and_clerkOrganizationId_and_status", {
			searchField: "name",
			filterFields: ["clerkOrganizationId", "status"],
		}),
	businessMemberships: defineTable(businessMembershipFieldsValidator.fields)
		.index("by_businessId", ["businessId"])
		.index("by_businessId_and_clerkUserTokenIdentifier", [
			"businessId",
			"clerkUserTokenIdentifier",
		])
		.index("by_businessId_and_clerkUserId", ["businessId", "clerkUserId"])
		.index("by_clerkUserTokenIdentifier_and_clerkOrganizationId", [
			"clerkUserTokenIdentifier",
			"clerkOrganizationId",
		])
		.index("by_clerkOrganizationMembershipId", [
			"clerkOrganizationMembershipId",
		])
		.index("by_clerkOrganizationId_and_clerkUserId", [
			"clerkOrganizationId",
			"clerkUserId",
		])
		.index("by_clerkUserId", ["clerkUserId"]),
	conversations: defineTable(conversationFieldsValidator.fields).index(
		"by_businessId",
		["businessId"],
	),
	deletedOrganizations: defineTable({
		clerkOrganizationId: v.string(),
		deletedAt: v.number(),
	}).index("by_clerkOrganizationId", ["clerkOrganizationId"]),
	deletedUsers: defineTable({
		clerkUserId: v.string(),
		deletedAt: v.number(),
	}).index("by_clerkUserId", ["clerkUserId"]),
	revokedOrganizationMembers: defineTable({
		clerkOrganizationId: v.string(),
		clerkOrganizationMembershipId: v.string(),
		clerkUserId: v.string(),
		revokedAt: v.number(),
	}).index("by_clerkOrganizationId_and_clerkUserId", [
		"clerkOrganizationId",
		"clerkUserId",
	]),
});
