import type { WebhookEvent } from "@clerk/backend";
import type { ClerkLifecycleEvent } from "./clerkWebhooks";

export async function readVerifiedClerkWebhookOccurredAt(request: Request) {
	const payload: unknown = await request.json();
	if (!isObject(payload)) return null;
	const timestamp = payload.timestamp;
	if (
		typeof timestamp !== "number" ||
		!Number.isSafeInteger(timestamp) ||
		timestamp <= 0
	)
		return null;
	return timestamp;
}

export function toClerkLifecycleEvent(
	event: WebhookEvent,
): ClerkLifecycleEvent | null {
	if (event.type === "organizationMembership.deleted") {
		return {
			type: event.type,
			clerkOrganizationId: event.data.organization.id,
			clerkOrganizationMembershipId: event.data.id,
			clerkUserId: event.data.public_user_data.user_id,
		};
	}
	if (event.type === "organization.deleted" && event.data.id) {
		return { type: event.type, clerkOrganizationId: event.data.id };
	}
	if (event.type === "user.deleted" && event.data.id) {
		return { type: event.type, clerkUserId: event.data.id };
	}
	return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
