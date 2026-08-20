import type { ReactNode } from "react";

export function PageHeader({
	title,
	actions,
}: {
	title: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<header className="flex min-h-8 flex-wrap items-center justify-between gap-3">
			<h1 className="font-heading text-base font-medium">{title}</h1>
			{actions ? (
				<div className="flex items-center gap-2">{actions}</div>
			) : null}
		</header>
	);
}
