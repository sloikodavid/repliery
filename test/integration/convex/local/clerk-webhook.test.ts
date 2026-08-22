import { createHmac } from "node:crypto";
import { beforeEach, expect, test } from "vitest";
import {
	adminClient,
	convexSiteUrl,
	eventually,
	localFunctions,
	resetLocal,
} from "../../../support/integration/convex/local/client";

beforeEach(resetLocal);

test("the deployed Clerk HTTP route verifies and deduplicates a signed request", async () => {
	const secret = Buffer.from("clerk-webhook-test-secret");
	const occurredAt = Date.now() - 1_000;
	const body = JSON.stringify({
		data: { id: "org_http_probe" },
		object: "event",
		timestamp: occurredAt,
		type: "organization.deleted",
	});
	const webhookId = "msg_http_probe";
	const webhookTimestamp = Math.floor(Date.now() / 1_000).toString();
	const signature = createHmac("sha256", secret)
		.update(`${webhookId}.${webhookTimestamp}.${body}`)
		.digest("base64");
	const request = () =>
		fetch(`${convexSiteUrl}/webhooks/clerk`, {
			body,
			headers: {
				"content-type": "application/json",
				"svix-id": webhookId,
				"svix-signature": `v1,${signature}`,
				"svix-timestamp": webhookTimestamp,
			},
			method: "POST",
		});

	await expect(request()).resolves.toMatchObject({ status: 204 });
	await expect(request()).resolves.toMatchObject({ status: 204 });
	const tombstones = await eventually(
		() =>
			adminClient.query(localFunctions.organizationDeletionState, {
				clerkOrganizationId: "org_http_probe",
			}),
		(value) => value.length === 1,
	);

	expect(tombstones).toEqual([occurredAt]);
});
