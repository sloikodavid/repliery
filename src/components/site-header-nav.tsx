"use client";

import { useAuth } from "@clerk/nextjs";
import { IconBuildingStore, IconBuildings } from "@tabler/icons-react";
import { useConvexAuth, useQuery } from "convex/react";
import { useParams, usePathname } from "next/navigation";
import {
	ContextNavigation,
	type ContextNavigationItem,
} from "@/components/context-navigation";
import { useBusinessNavigation } from "@/features/businesses/business-navigation";
import { isPathWithin, routes } from "@/lib/routes";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function SiteHeaderNav() {
	const { orgId, orgSlug } = useAuth();
	const { isAuthenticated } = useConvexAuth();
	const pathname = usePathname();
	const params = useParams<{
		businessId?: string;
		organizationSlug?: string;
	}>();
	const businessId =
		typeof params.businessId === "string" ? params.businessId : null;
	const routeOrganizationSlug =
		typeof params.organizationSlug === "string"
			? params.organizationSlug
			: null;
	const navigation = useBusinessNavigation(
		isAuthenticated ? (orgId ?? null) : null,
	);
	const business = useQuery(
		api.businesses.get,
		isAuthenticated &&
			orgId &&
			orgSlug &&
			businessId &&
			routeOrganizationSlug === orgSlug
			? { businessId: businessId as Id<"businesses"> }
			: "skip",
	);
	if (!orgId || !orgSlug || !isAuthenticated || !navigation) {
		return null;
	}
	const businessesHref = routes.businesses.index(orgSlug);
	const isInBusinesses = isPathWithin(pathname, businessesHref);
	const items: ContextNavigationItem[] =
		navigation.kind === "business"
			? [
					{
						href: routes.businesses.byId(orgSlug, navigation.businessId),
						icon: IconBuildingStore,
						label: navigation.businessName,
						state: isPathWithin(
							pathname,
							routes.businesses.byId(orgSlug, navigation.businessId),
						)
							? "active"
							: "inactive",
					},
				]
			: [
					{
						href: businessesHref,
						icon: IconBuildings,
						label: "Businesses",
						state:
							pathname === businessesHref
								? "active"
								: isInBusinesses
									? "ancestor"
									: "inactive",
					},
					...(business
						? [
								{
									href: routes.businesses.byId(orgSlug, business._id),
									icon: IconBuildingStore,
									label: business.name,
									state: "active" as const,
								},
							]
						: []),
				];

	return <ContextNavigation items={items} />;
}
