import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

export default function NotFound() {
	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">404</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						Page not found
					</h1>
					<p className="text-muted-foreground">
						The page you requested doesn&apos;t exist or may have moved.
					</p>
				</div>
				<Link href={siteConfig.routes.home} className={buttonVariants()}>
					Return home
				</Link>
			</div>
		</main>
	);
}
