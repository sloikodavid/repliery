"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FallbackPageContent } from "@/components/fallback-page-content";
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
			<FallbackPageContent
				eyebrow="Something went wrong"
				title="We couldn&apos;t load this page."
				description={
					<>Try again, or return to {siteConfig.name} and start over.</>
				}
				actions={
					<>
						<button type="button" onClick={retry} className={buttonVariants()}>
							Try again
						</button>
						<Link
							href={siteConfig.routes.home}
							className={buttonVariants({ variant: "outline" })}
						>
							Return home
						</Link>
					</>
				}
			/>
		</main>
	);
}
