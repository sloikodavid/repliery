import type { ReactNode } from "react";

type FallbackPageContentProps = {
	eyebrow: ReactNode;
	title: ReactNode;
	description: ReactNode;
	actions: ReactNode;
};

export function FallbackPageContent({
	eyebrow,
	title,
	description,
	actions,
}: FallbackPageContentProps) {
	return (
		<div className="w-full max-w-md space-y-6 text-center">
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				<p className="text-muted-foreground">{description}</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{actions}
			</div>
		</div>
	);
}
