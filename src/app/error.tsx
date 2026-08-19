"use client";

import Link from "next/link";
import {
	ErrorFallback,
	type ErrorFallbackProps,
} from "@/components/error-fallback";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

export default function ErrorPage({ error, retry }: ErrorFallbackProps) {
	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<ErrorFallback
				error={error}
				retry={retry}
				title="We couldn&apos;t load this page."
				description={
					<>Try again, or return to {siteConfig.name} and start over.</>
				}
				additionalActions={
					<Link
						href={siteConfig.routes.home}
						className={buttonVariants({ variant: "outline" })}
					>
						Return home
					</Link>
				}
			/>
		</main>
	);
}
