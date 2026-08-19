"use client";

import {
	ErrorFallback,
	type ErrorFallbackProps,
} from "@/components/error-fallback";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export default function GlobalErrorPage({ error, retry }: ErrorFallbackProps) {
	return (
		<html lang="en">
			<body className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
				<main className="w-full">
					<ErrorFallback
						error={error}
						retry={retry}
						title={`${siteConfig.name} needs a refresh.`}
						description="The application encountered an unexpected error."
					/>
				</main>
			</body>
		</html>
	);
}
