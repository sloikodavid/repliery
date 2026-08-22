import type { UserIdentity } from "convex/server";
import { expect, test } from "vitest";
import { hasClerkPermission } from "../../../convex/model/auth";
import { clerkPermissions } from "../../../shared/clerk-contract";

test("compact Clerk permissions use arbitrary-width bitmaps", () => {
	const permissionNames = Array.from({ length: 36 }, (_, index) =>
		index === 35 ? "manage" : `permission_${index}`,
	);
	const compactIdentity = {
		issuer: "https://clerk.example.test",
		subject: "user_admin",
		tokenIdentifier: "https://clerk.example.test|user_admin",
		fea: "o:businesses",
		o: {
			id: "org_one",
			per: permissionNames.join(","),
			fpm: (BigInt(1) << BigInt(35)).toString(),
		},
	} as UserIdentity;
	expect(
		hasClerkPermission(compactIdentity, clerkPermissions.manageBusinesses),
	).toBe(true);
});

test("deprecated Clerk session token claims are not accepted", () => {
	// LEGACY: this negative test guards obsolete Clerk claims; remove when that claim history is no longer relevant to auth-boundary coverage.
	const deprecatedIdentity = {
		issuer: "https://clerk.example.test",
		subject: "user_admin",
		tokenIdentifier: "https://clerk.example.test|user_admin",
		org_id: "org_one",
		org_permissions: [clerkPermissions.manageBusinesses],
	} as UserIdentity;
	expect(
		hasClerkPermission(deprecatedIdentity, clerkPermissions.manageBusinesses),
	).toBe(false);
});
