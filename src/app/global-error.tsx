"use client";

import { useEffect } from "react";
import { FallbackPageContent } from "@/components/fallback-page-content";
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
				<main className="w-full">
					<FallbackPageContent
						eyebrow="Something went wrong"
						title={`${siteConfig.name} needs a refresh.`}
						description="The application encountered an unexpected error."
						actions={
							<button
								type="button"
								onClick={retry}
								className={buttonVariants()}
							>
								Try again
							</button>
						}
					/>
				</main>
			</body>
		</html>
	);
}
