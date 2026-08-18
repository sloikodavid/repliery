import { DM_Mono, DM_Sans } from "next/font/google";

export const dmSans = DM_Sans({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-dm-sans",
});

export const dmMono = DM_Mono({
	weight: ["300", "400", "500"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-dm-mono",
});
