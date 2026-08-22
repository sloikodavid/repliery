import { expect, test } from "@playwright/test";

test("the public shell is usable at this browser's viewport", {
	tag: "@smoke",
}, async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("Repliery");
	await expect(page.getByRole("link", { name: "Repliery" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Repliery" })).toHaveAttribute(
		"href",
		"/",
	);
	const hasHorizontalOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth,
	);
	expect(hasHorizontalOverflow).toBe(false);
});
