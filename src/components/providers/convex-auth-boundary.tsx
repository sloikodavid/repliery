"use client";

import { Authenticated, AuthLoading } from "convex/react";
import type { PropsWithChildren } from "react";
import { Spinner } from "@/components/ui/spinner";

export function ConvexAuthBoundary({ children }: PropsWithChildren) {
	return (
		<>
			<AuthLoading>
				<main
					className="flex flex-1 items-center justify-center"
					aria-label="Loading"
				>
					<Spinner className="size-5" />
				</main>
			</AuthLoading>
			<Authenticated>{children}</Authenticated>
		</>
	);
}
