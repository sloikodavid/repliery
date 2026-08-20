/// <reference types="vite/client" />

import { createHmac } from "node:crypto";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const originalSigningSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

afterEach(() => {
	if (originalSigningSecret === undefined)
		delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
	else process.env.CLERK_WEBHOOK_SIGNING_SECRET = originalSigningSecret;
});

describe("Clerk webhook HTTP boundary", () => {
	test("verifies Svix headers, preserves Clerk's event timestamp, and handles duplicate delivery idempotently", async () => {
		const secretBytes = Buffer.from("clerk-webhook-test-secret");
		process.env.CLERK_WEBHOOK_SIGNING_SECRET = `whsec_${secretBytes.toString("base64")}`;
		const eventTimestamp = Date.now() - 1_000;
		const body = JSON.stringify({
			data: { id: "org_one" },
			object: "event",
			type: "organization.deleted",
			timestamp: eventTimestamp,
		});
		const webhookId = "msg_organization_deleted";
		const webhookTimestamp = Math.floor(Date.now() / 1_000).toString();
		const signature = createHmac("sha256", secretBytes)
			.update(`${webhookId}.${webhookTimestamp}.${body}`)
			.digest("base64");
		const request = {
			method: "POST",
			body,
			headers: {
				"content-type": "application/json",
				"svix-id": webhookId,
				"svix-timestamp": webhookTimestamp,
				"svix-signature": `v1,${signature}`,
			},
		};
		const t = convexTest(schema, modules);

		await expect(t.fetch("/webhooks/clerk", request)).resolves.toMatchObject({
			status: 204,
		});
		await expect(t.fetch("/webhooks/clerk", request)).resolves.toMatchObject({
			status: 204,
		});
		await expect(
			t.run((ctx) => ctx.db.query("deletedOrganizations").collect()),
		).resolves.toEqual([
			expect.objectContaining({
				clerkOrganizationId: "org_one",
				deletedAt: eventTimestamp,
			}),
		]);
	});

	test("rejects a request without the required Svix signature headers", async () => {
		process.env.CLERK_WEBHOOK_SIGNING_SECRET = `whsec_${Buffer.from("clerk-webhook-test-secret").toString("base64")}`;
		const response = await convexTest(schema, modules).fetch(
			"/webhooks/clerk",
			{
				method: "POST",
				body: "{}",
				headers: { "content-type": "application/json" },
			},
		);
		expect(response.status).toBe(400);
	});
});
