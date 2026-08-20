"use client";

import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { RouterProvider } from "react-aria-components";

export function ReactAriaRouterProvider({ children }: PropsWithChildren) {
	const router = useRouter();

	return <RouterProvider navigate={router.push}>{children}</RouterProvider>;
}
