"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { routes } from "@/lib/routes";
import { api } from "../../../convex/_generated/api";

type BusinessNavigation = NonNullable<
	FunctionReturnType<typeof api.businesses.navigation>
>;

export function useBusinessNavigation(clerkOrganizationId: string | null) {
	return useQuery(
		api.businesses.navigation,
		clerkOrganizationId ? { clerkOrganizationId } : "skip",
	);
}

export function getBusinessNavigationHref(
	organizationSlug: string,
	navigation: BusinessNavigation,
) {
	return navigation.kind === "business"
		? routes.businesses.byId(organizationSlug, navigation.businessId)
		: routes.businesses.index(organizationSlug);
}
