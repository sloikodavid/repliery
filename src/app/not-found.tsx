import Link from "next/link";
import { FallbackPageContent } from "@/components/fallback-page-content";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/routes";

export default function NotFound() {
	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<FallbackPageContent
				eyebrow="404"
				title="Page not found"
				description="The page you requested doesn't exist or may have moved."
				actions={
					<Link href={routes.root} className={buttonVariants()}>
						Return home
					</Link>
				}
			/>
		</main>
	);
}
