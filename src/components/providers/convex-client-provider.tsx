"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: React.PropsWithChildren) {
	return (
		// biome-ignore lint/nursery/useReactCompiler: Convex requires the Clerk hook itself.
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			{children}
		</ConvexProviderWithClerk>
	);
}
