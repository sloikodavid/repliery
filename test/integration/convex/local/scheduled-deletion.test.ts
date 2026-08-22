import { beforeEach, expect, test } from "vitest";
import {
	adminClient,
	eventually,
	localFunctions,
	resetLocal,
} from "../../../support/integration/convex/local/client";

beforeEach(resetLocal);

test("scheduled Business deletion continues through every purge batch", async () => {
	const businessId = await adminClient.mutation(
		localFunctions.startBusinessDeletion,
		{ conversationCount: 101 },
	);
	const state = await eventually(
		() =>
			adminClient.query(localFunctions.businessDeletionState, { businessId }),
		(value) => !value.businessExists && value.conversationCount === 0,
	);

	expect(state).toEqual({ businessExists: false, conversationCount: 0 });
});
