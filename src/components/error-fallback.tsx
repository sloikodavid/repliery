"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { FallbackPageContent } from "@/components/fallback-page-content";
import { buttonVariants } from "@/components/ui/button-variants";

export type ErrorFallbackProps = {
	error: Error & { digest?: string };
	retry: () => void;
};

type ErrorFallbackComponentProps = ErrorFallbackProps & {
	title: ReactNode;
	description: ReactNode;
	additionalActions?: ReactNode;
};

export function ErrorFallback({
	error,
	retry,
	title,
	description,
	additionalActions,
}: ErrorFallbackComponentProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<FallbackPageContent
			eyebrow="Something went wrong"
			title={title}
			description={description}
			actions={
				<>
					<button type="button" onClick={retry} className={buttonVariants()}>
						Try again
					</button>
					{additionalActions}
				</>
			}
		/>
	);
}
