import type { WebhookEvent } from "@clerk/backend";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { env, httpAction } from "./_generated/server";
import {
	readVerifiedClerkWebhookOccurredAt,
	toClerkLifecycleEvent,
} from "./model/clerkWebhookRequest";

const http = httpRouter();

http.route({
	path: "/webhooks/clerk",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const signingSecret = env.CLERK_WEBHOOK_SIGNING_SECRET;
		// verifyWebhook consumes the body and returns Clerk's narrowed event type, which omits the documented envelope timestamp.
		const payloadRequest = request.clone();
		let event: WebhookEvent;
		try {
			event = await verifyWebhook(request, { signingSecret });
		} catch {
			return new Response("Invalid webhook signature", { status: 400 });
		}

		const occurredAt = await readVerifiedClerkWebhookOccurredAt(payloadRequest);
		if (!occurredAt)
			return new Response("Invalid webhook payload", { status: 400 });

		const lifecycleEvent = toClerkLifecycleEvent(event);
		if (lifecycleEvent) {
			await ctx.runMutation(internal.clerkWebhooks.process, {
				occurredAt,
				event: lifecycleEvent,
			});
		}
		return new Response(null, { status: 204 });
	}),
});

export default http;
