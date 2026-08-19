import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
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
					waitlistUrl={siteConfig.routes.waitlist}
				>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
						<SiteHeader />
						{children}
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
