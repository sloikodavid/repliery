import { auth } from "@clerk/nextjs/server";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

export default async function DashboardLayout({
	children,
}: LayoutProps<"/dashboard">) {
	await auth.protect();

	// Move this to the root layout if public routes need Convex.
	return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
