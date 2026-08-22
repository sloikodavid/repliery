import { v } from "convex/values";
import { businessSorts } from "../shared/business-contract";

export const businessSortValidator = v.union(
	v.literal(businessSorts.newest),
	v.literal(businessSorts.oldest),
);

export const businessStatusValidator = v.union(
	v.literal("active"),
	v.literal("deleting"),
);

export const businessFieldsValidator = v.object({
	name: v.string(),
	clerkOrganizationId: v.string(),
	status: businessStatusValidator,
});

export const businessDocumentValidator = businessFieldsValidator.extend({
	_id: v.id("businesses"),
	_creationTime: v.number(),
});

export const businessMembershipFieldsValidator = v.object({
	businessId: v.id("businesses"),
	clerkOrganizationId: v.string(),
	clerkOrganizationMembershipId: v.string(),
	clerkUserId: v.string(),
	clerkUserTokenIdentifier: v.string(),
});

export const businessMembershipDocumentValidator =
	businessMembershipFieldsValidator.extend({
		_id: v.id("businessMemberships"),
		_creationTime: v.number(),
	});

export const conversationFieldsValidator = v.object({
	businessId: v.id("businesses"),
});

export const conversationDocumentValidator = conversationFieldsValidator.extend(
	{
		_id: v.id("conversations"),
		_creationTime: v.number(),
	},
);
