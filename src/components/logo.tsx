import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

const interLetterGaps = [
	-0.04, 0.01, -0.005, -0.005, -0.005, 0.01, 0.04,
] as const;

export function Logo() {
	const letters = Array.from(siteConfig.name);

	return (
		<span className="flex items-center gap-2 whitespace-nowrap">
			<span className="relative size-8 shrink-0 overflow-hidden rounded-full">
				<Image
					alt=""
					height={32}
					loading="eager"
					src="/icon.svg"
					width={32}
					unoptimized
				/>
				<span
					aria-hidden="true"
					className="absolute top-0 left-0 h-full w-1/4 -translate-x-[300%] -skew-x-45 bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-300 ease-out group-hover/logo:translate-x-[600%] group-focus-visible/logo:translate-x-[600%] motion-reduce:transition-none motion-reduce:opacity-0"
				/>
			</span>
			<span className="font-figtree text-[24px] leading-none font-[750] tracking-[-0.035em] text-foreground">
				{letters.map((letter, index) => {
					const gap = interLetterGaps[index];
					return (
						<span
							key={letters.slice(0, index + 1).join("")}
							style={
								gap === undefined ? undefined : { marginInlineEnd: `${gap}em` }
							}
						>
							{letter}
						</span>
					);
				})}
			</span>
		</span>
	);
}
