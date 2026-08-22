import { readFile, rm } from "node:fs/promises";
import { createClerkClient } from "@clerk/backend";
import { test as teardown } from "@playwright/test";
import { clerkState } from "../../support/e2e/paths";

teardown("delete the Clerk test identity", async () => {
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set.");
	let contents: string;
	try {
		contents = await readFile(clerkState, "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
		throw error;
	}
	const state = JSON.parse(contents) as {
		organizationId?: string;
		userId: string;
	};
	const client = createClerkClient({ secretKey });
	const failures: unknown[] = [];
	if (state.organizationId) {
		try {
			await client.organizations.deleteOrganization(state.organizationId);
		} catch (error) {
			failures.push(error);
		}
	}
	try {
		await client.users.deleteUser(state.userId);
	} catch (error) {
		failures.push(error);
	}
	await rm(clerkState, { force: true });
	if (failures.length > 0) {
		throw new AggregateError(failures, "Clerk test identity cleanup failed.");
	}
});
