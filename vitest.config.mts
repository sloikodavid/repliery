import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					environment: "node",
					include: ["test/unit/**/*.test.ts", "test/unit/**/*.test.tsx"],
					name: "unit",
				},
			},
			{
				test: {
					environment: "edge-runtime",
					include: ["test/integration/convex/mock/**/*.test.ts"],
					name: "convex-mock",
				},
			},
			{
				test: {
					environment: "node",
					fileParallelism: false,
					hookTimeout: 30_000,
					include: ["test/integration/convex/local/**/*.test.ts"],
					maxWorkers: 1,
					name: "convex-local",
					testTimeout: 30_000,
				},
			},
		],
	},
});
