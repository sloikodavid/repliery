import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClerkClient } from "@clerk/backend";
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { clerkState } from "../../support/e2e/paths";

setup.describe.configure({ mode: "serial" });

setup("configure Clerk testing and create its test identity", async () => {
	await clerkSetup();
	const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!emailAddress || !secretKey) {
		throw new Error("The authenticated E2E identity is not configured.");
	}
	const client = createClerkClient({ secretKey });
	const user = await client.users.createUser({
		emailAddress: [emailAddress],
		firstName: "E2E",
		lastName: "User",
		skipLegalChecks: true,
	});
	await mkdir(dirname(clerkState), { recursive: true });
	await writeFile(clerkState, JSON.stringify({ userId: user.id }), "utf8");
	const organization = await client.organizations.createOrganization({
		createdBy: user.id,
		name: "E2E Browser Test",
		slug: `e2e-${randomUUID()}`,
	});
	await writeFile(
		clerkState,
		JSON.stringify({
			organizationId: organization.id,
			organizationSlug: organization.slug,
			userId: user.id,
		}),
		"utf8",
	);
});
