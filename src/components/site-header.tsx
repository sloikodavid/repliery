import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteHeaderAuthControls } from "@/components/site-header-auth-controls";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
	return (
		<header className="mx-auto w-full max-w-6xl px-2 max-[359px]:px-1">
			<div className="flex h-16 items-center justify-between gap-4 max-[359px]:gap-2">
				<Link
					href={siteConfig.routes.home}
					aria-label={siteConfig.name}
					className="group/logo flex shrink-0 items-center p-2 outline-none transition-colors hover:bg-foreground/3 focus-visible:bg-foreground/3 focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<Logo />
				</Link>

				<Show when="signed-out">
					<nav
						aria-label="Account"
						className="flex items-center gap-2 max-[359px]:gap-1"
					>
						<Link
							href={siteConfig.routes.signIn}
							className={buttonVariants({ variant: "ghost" })}
						>
							Sign in
						</Link>
						<Link
							href={siteConfig.routes.waitlist}
							className={buttonVariants()}
						>
							Join waitlist
						</Link>
					</nav>
				</Show>

				<Show when="signed-in">
					<SiteHeaderAuthControls />
				</Show>
			</div>
		</header>
	);
}
