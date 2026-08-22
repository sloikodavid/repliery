import type { UserIdentityAttributes } from "convex/server";
import { beforeEach, expect, test } from "vitest";
import { api } from "../../../../convex/_generated/api";
import {
	adminClient,
	authenticatedClient,
	eventually,
	localFunctions,
	resetLocal,
} from "../../../support/integration/convex/local/client";

beforeEach(resetLocal);

test("the production search index filters results by the active Organization", async () => {
	await adminClient.mutation(localFunctions.seedBusinesses, {
		businesses: [
			{ clerkOrganizationId: "org_search_probe", name: "Northwind Dental" },
			{ clerkOrganizationId: "org_search_probe", name: "Northwind Repairs" },
			{ clerkOrganizationId: "org_other", name: "Northwind Private" },
		],
	});
	const manager = authenticatedClient({
		issuer: "https://clerk.example.test",
		subject: "user_admin",
		fea: "o:businesses,o:business_memberships",
		o: {
			id: "org_search_probe",
			rol: "admin",
			per: "manage",
			fpm: "1,1",
		},
	} satisfies UserIdentityAttributes);

	const results = await eventually(
		() =>
			manager.query(api.businesses.list, {
				paginationOpts: { cursor: null, numItems: 20 },
				search: "Northwind",
				sort: "newest",
			}),
		(value) => value.page.length === 2,
	);

	expect(results.page.map((business) => business.name).sort()).toEqual([
		"Northwind Dental",
		"Northwind Repairs",
	]);
});
