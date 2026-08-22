import { ConvexHttpClient } from "convex/browser";
import {
	makeFunctionReference,
	type UserIdentityAttributes,
} from "convex/server";
import type { Id } from "../../../../../convex/_generated/dataModel";

function requiredEnvironment(name: string) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`The local Convex harness did not provide ${name}.`);
	}
	return value;
}

const convexUrl = requiredEnvironment("NEXT_PUBLIC_CONVEX_URL");
export const convexSiteUrl = requiredEnvironment("NEXT_PUBLIC_CONVEX_SITE_URL");
const adminKey = requiredEnvironment("CONVEX_TEST_ADMIN_KEY");

export const localFunctions = {
	reset: makeFunctionReference<"mutation", Record<string, never>, null>(
		"testing:reset",
	),
	seedBusinesses: makeFunctionReference<
		"mutation",
		{ businesses: Array<{ clerkOrganizationId: string; name: string }> },
		null
	>("testing:seedBusinesses"),
	startBusinessDeletion: makeFunctionReference<
		"mutation",
		{ conversationCount: number },
		Id<"businesses">
	>("testing:startBusinessDeletion"),
	businessDeletionState: makeFunctionReference<
		"query",
		{ businessId: Id<"businesses"> },
		{ businessExists: boolean; conversationCount: number }
	>("testing:businessDeletionState"),
	organizationDeletionState: makeFunctionReference<
		"query",
		{ clerkOrganizationId: string },
		number[]
	>("testing:organizationDeletionState"),
};

function setAdminAuth(
	client: ConvexHttpClient,
	identity?: UserIdentityAttributes,
) {
	(
		client as unknown as {
			setAdminAuth: (
				adminToken: string,
				actingAsIdentity?: UserIdentityAttributes,
			) => void;
		}
	).setAdminAuth(adminKey, identity);
}

export const adminClient = new ConvexHttpClient(convexUrl);
setAdminAuth(adminClient);

export function authenticatedClient(identity: UserIdentityAttributes) {
	const client = new ConvexHttpClient(convexUrl);
	setAdminAuth(client, identity);
	return client;
}

export async function resetLocal() {
	await adminClient.mutation(localFunctions.reset, {});
}

export async function eventually<T>(
	read: () => Promise<T>,
	accepts: (value: T) => boolean,
) {
	const deadline = Date.now() + 15_000;
	let value = await read();
	while (!accepts(value) && Date.now() < deadline) {
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
		value = await read();
	}
	return value;
}
