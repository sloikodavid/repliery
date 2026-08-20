import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
	env: {
		CLERK_SECRET_KEY: v.string(),
		CLERK_WEBHOOK_SIGNING_SECRET: v.string(),
	},
});
