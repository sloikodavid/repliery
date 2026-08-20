import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ReactAriaRouterProvider } from "@/components/providers/react-aria-router-provider";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";
import { dmSans, figtree } from "./fonts";

export const metadata: Metadata = {
	applicationName: siteConfig.name,
	title: {
		default: siteConfig.name,
		template: `%s · ${siteConfig.name}`,
	},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${dmSans.variable} ${figtree.variable} antialiased`}
			suppressHydrationWarning
		>
			<body className="flex min-h-dvh flex-col">
				<ClerkProvider
					appearance={{
						theme: shadcn,
						variables: {
							borderRadius: "0rem",
							spacing: "1rem",
						},
					}}
					waitlistUrl={routes.waitlist}
				>
					<ConvexClientProvider>
						<ReactAriaRouterProvider>
							<ThemeProvider
								attribute="class"
								defaultTheme="system"
								disableTransitionOnChange
								enableSystem
							>
								<SiteHeader />
								{children}
								<Toaster />
							</ThemeProvider>
						</ReactAriaRouterProvider>
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
