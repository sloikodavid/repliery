import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({ className, ...props }: ComponentProps<"main">) {
	return (
		<main
			className={cn(
				"mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12",
				className,
			)}
			{...props}
		/>
	);
}
