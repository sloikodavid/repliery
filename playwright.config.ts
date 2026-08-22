// biome-ignore lint/correctness/noUnresolvedImports: @playwright/test re-exports Playwright's devices registry.
import { defineConfig, devices } from "@playwright/test";
import { playwrightArtifacts } from "./test/support/e2e/paths";

export default defineConfig({
	expect: { timeout: 5_000 },
	failOnFlakyTests: Boolean(process.env.CI),
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: true,
	outputDir: `${playwrightArtifacts}/results`,
	projects: [
		{
			name: "clerk-setup",
			teardown: "clerk-teardown",
			testMatch: "**/authenticated/clerk.setup.ts",
		},
		{
			name: "clerk-teardown",
			testMatch: "**/authenticated/clerk.teardown.ts",
		},
		{
			name: "public-chromium",
			testMatch: "**/public/**/*.test.ts",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "public-firefox",
			testMatch: "**/public/**/*.test.ts",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "public-webkit",
			testMatch: "**/public/**/*.test.ts",
			use: { ...devices["Desktop Safari"] },
		},
		{
			name: "public-mobile-webkit",
			testMatch: "**/public/**/*.test.ts",
			use: { ...devices["iPhone 15"] },
		},
		{
			dependencies: ["clerk-setup"],
			name: "authenticated-chromium",
			testMatch: "**/authenticated/**/*.test.ts",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			dependencies: ["clerk-setup"],
			name: "authenticated-firefox",
			testMatch: "**/authenticated/**/*.test.ts",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			dependencies: ["clerk-setup"],
			name: "authenticated-webkit",
			testMatch: "**/authenticated/**/*.test.ts",
			use: { ...devices["Desktop Safari"] },
		},
	],
	reporter: process.env.CI
		? [
				["line"],
				[
					"html",
					{ open: "never", outputFolder: `${playwrightArtifacts}/report` },
				],
			]
		: [
				["list"],
				[
					"html",
					{ open: "never", outputFolder: `${playwrightArtifacts}/report` },
				],
			],
	retries: process.env.CI ? 1 : 0,
	retryStrategy: process.env.CI ? "isolated" : "immediate",
	testDir: "test/e2e",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:3100",
		screenshot: "only-on-failure",
		trace: "on-first-retry",
		video: "off",
	},
	webServer: {
		command: "pnpm build && pnpm start --port 3100",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		url: "http://127.0.0.1:3100",
	},
	workers: process.env.CI ? 1 : undefined,
});
