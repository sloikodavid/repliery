import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import { dmMono, dmSans } from "./fonts";

export const metadata: Metadata = {
	title: "Repliery",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body className="flex min-h-full flex-col">
				<ClerkProvider
					appearance={{
						theme: shadcn,
						variables: {
							borderRadius: "0rem",
							spacing: "0.875rem",
						},
					}}
					waitlistUrl="/waitlist"
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
