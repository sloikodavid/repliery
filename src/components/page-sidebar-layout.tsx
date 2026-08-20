import type { ReactNode } from "react";

export function PageSidebarLayout({
	sidebar,
	children,
}: {
	sidebar: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="grid min-w-0 gap-6 md:grid-cols-[11rem_minmax(0,1fr)]">
			<aside className="min-w-0 md:border-r md:pr-4">{sidebar}</aside>
			<div className="min-w-0">{children}</div>
		</div>
	);
}
