import { readFile } from "node:fs/promises";
import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { clerkState } from "../../support/e2e/paths";

test("an authenticated Organization member reaches the Business workspace", {
	tag: "@smoke",
}, async ({ context, page }) => {
	const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
	if (!emailAddress) throw new Error("E2E_CLERK_USER_EMAIL is not set.");
	const authenticationPage = await context.newPage();
	await authenticationPage.goto("/");
	await clerk.signIn({ emailAddress, page: authenticationPage });
	await authenticationPage.close();
	const organization = JSON.parse(await readFile(clerkState, "utf8")) as {
		organizationSlug: string;
	};
	await page.goto(`/organizations/${organization.organizationSlug}`);
	await expect(page.getByRole("heading", { name: "Businesses" })).toBeVisible();
});
