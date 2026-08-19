import Link from "next/link";
import { FallbackPageContent } from "@/components/fallback-page-content";
import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/lib/site-config";

export default function NotFound() {
	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<FallbackPageContent
				eyebrow="404"
				title="Page not found"
				description="The page you requested doesn&apos;t exist or may have moved."
				actions={
					<Link href={siteConfig.routes.home} className={buttonVariants()}>
						Return home
					</Link>
				}
			/>
		</main>
	);
}
