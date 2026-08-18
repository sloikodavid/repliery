"use client";

import { OrganizationSwitcher, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
	return (
		<header className="border-b">
			<div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
				<Link
					href="/"
					className="shrink-0 py-1 text-sm font-semibold tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
				>
					Repliery
				</Link>

				<Show when="signed-out">
					<nav aria-label="Account" className="flex items-center gap-2">
						<Link
							href="/sign-in"
							className={buttonVariants({ variant: "ghost" })}
						>
							Sign in
						</Link>
						<Link href="/waitlist" className={buttonVariants()}>
							Join waitlist
						</Link>
					</nav>
				</Show>

				<Show when="signed-in">
					<div className="flex min-w-0 items-center gap-2">
						<OrganizationSwitcher hidePersonal />
						<UserButton />
					</div>
				</Show>
			</div>
		</header>
	);
}
