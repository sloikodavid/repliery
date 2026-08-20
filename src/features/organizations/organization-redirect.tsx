"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
	getBusinessNavigationHref,
	useBusinessNavigation,
} from "@/features/businesses/business-navigation";
import { routes } from "@/lib/routes";

export function OrganizationRedirect({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const { orgId } = useAuth();
	const router = useRouter();
	const navigation = useBusinessNavigation(orgId ?? null);

	useEffect(() => {
		if (navigation === undefined) {
			return;
		}
		router.replace(
			navigation
				? getBusinessNavigationHref(organizationSlug, navigation)
				: routes.root,
		);
	}, [navigation, organizationSlug, router]);

	return (
		<main
			className="flex flex-1 items-center justify-center"
			aria-label="Opening organization"
		>
			<Spinner className="size-5" />
		</main>
	);
}
