import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteHeaderAuthControls } from "@/components/site-header-auth-controls";
import { SiteHeaderNav } from "@/components/site-header-nav";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
	return (
		<header className="mx-auto w-full max-w-6xl px-2 max-[359px]:px-1">
			<div className="flex min-h-16 flex-wrap items-center gap-x-2 gap-y-2 py-2">
				<Link
					href={routes.root}
					aria-label={siteConfig.name}
					className="group/logo flex shrink-0 items-center p-2 outline-none transition-colors hover:bg-foreground/3 focus-visible:bg-foreground/3 focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<Logo />
				</Link>

				<Show when="signed-in">
					<SiteHeaderNav />
				</Show>

				<Show when="signed-out">
					<nav
						aria-label="Account"
						className="ml-auto flex items-center gap-2 max-[359px]:gap-1"
					>
						<Link
							href={routes.signIn}
							className={buttonVariants({ variant: "ghost" })}
						>
							Sign in
						</Link>
						<Link href={routes.waitlist} className={buttonVariants()}>
							Join waitlist
						</Link>
					</nav>
				</Show>

				<Show when="signed-in">
					<div className="ml-auto">
						<SiteHeaderAuthControls />
					</div>
				</Show>
			</div>
		</header>
	);
}
