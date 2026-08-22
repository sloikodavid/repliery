import { IconChevronRight, type TablerIcon } from "@tabler/icons-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export type ContextNavigationState = "active" | "ancestor" | "inactive";

export type ContextNavigationItem = {
	href: string;
	icon: TablerIcon;
	label: string;
	state: ContextNavigationState;
};

const itemVariants = {
	active: "secondary",
	ancestor: "ancestor",
	inactive: "ghost",
} as const;

export function ContextNavigation({
	items,
}: {
	items: readonly ContextNavigationItem[];
}) {
	return (
		<nav
			aria-label="Context"
			className="order-3 flex min-w-0 basis-full items-center gap-1 border-t border-border/60 pt-2 sm:order-none sm:basis-auto sm:border-t-0 sm:pt-0"
		>
			{items.map((item, index) => (
				<span key={item.href} className="contents">
					{index > 0 ? (
						<IconChevronRight
							aria-hidden="true"
							className="size-3.5 shrink-0 text-muted-foreground"
						/>
					) : null}
					<Link
						href={item.href}
						aria-current={item.state === "active" ? "location" : undefined}
						className={cn(
							buttonVariants({
								variant: itemVariants[item.state],
								iconSpacing: "balanced",
								size: "sm",
							}),
							"min-w-0 max-w-44 sm:max-w-64",
						)}
					>
						<item.icon aria-hidden="true" data-icon="inline-start" />
						<span className="truncate">{item.label}</span>
					</Link>
				</span>
			))}
		</nav>
	);
}
