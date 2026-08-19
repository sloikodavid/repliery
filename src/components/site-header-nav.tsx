import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

export function SiteHeaderNav() {
	return (
		<nav
			aria-label="Primary"
			className="order-3 flex basis-full items-center gap-1 border-t border-border/60 pt-2 sm:order-none sm:basis-auto sm:border-t-0 sm:pt-0"
		>
			<Link
				href={siteConfig.routes.dashboard}
				className={buttonVariants({
					variant: "ghost",
					size: "sm",
				})}
			>
				Dashboard
			</Link>
		</nav>
	);
}
