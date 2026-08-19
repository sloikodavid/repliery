"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

type ErrorPageProps = {
	error: Error & { digest?: string };
	retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">
						Something went wrong
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						We couldn&apos;t load this page.
					</h1>
					<p className="text-muted-foreground">
						Try again, or return to {siteConfig.name} and start over.
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-2">
					<button type="button" onClick={retry} className={buttonVariants()}>
						Try again
					</button>
					<Link
						href={siteConfig.routes.home}
						className={buttonVariants({ variant: "outline" })}
					>
						Return home
					</Link>
				</div>
			</div>
		</main>
	);
}
