"use client";

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

type GlobalErrorPageProps = {
	error: Error & { digest?: string };
	retry: () => void;
};

export default function GlobalErrorPage({
	error,
	retry,
}: GlobalErrorPageProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
				<main className="w-full max-w-md space-y-6 text-center">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">
							Something went wrong
						</p>
						<h1 className="text-3xl font-semibold tracking-tight">
							{siteConfig.name} needs a refresh.
						</h1>
						<p className="text-muted-foreground">
							The application encountered an unexpected error.
						</p>
					</div>
					<div className="flex justify-center">
						<button type="button" onClick={retry} className={buttonVariants()}>
							Try again
						</button>
					</div>
				</main>
			</body>
		</html>
	);
}
