"use client";

import { useAuth } from "@clerk/nextjs";
import {
	IconMessageCircle,
	IconSettings,
	IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { PageContainer } from "@/components/page-container";
import { PageSidebarLayout } from "@/components/page-sidebar-layout";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { clerkPermissions } from "../../../convex/clerkContract";

export function BusinessShell({
	children,
	organizationSlug,
	businessId,
}: PropsWithChildren<{ organizationSlug: string; businessId: string }>) {
	const pathname = usePathname();
	const { has } = useAuth();
	const business = useQuery(api.businesses.get, {
		businessId: businessId as Id<"businesses">,
	});
	const canManageMemberships = has?.({
		permission: clerkPermissions.manageBusinessMemberships,
	});
	const canManageBusinesses = has?.({
		permission: clerkPermissions.manageBusinesses,
	});

	if (!business) {
		return null;
	}

	const conversationsHref = routes.conversations.index(
		organizationSlug,
		businessId,
	);
	const membersHref = routes.businessMemberships.index(
		organizationSlug,
		businessId,
	);
	const settingsHref = routes.businessSettings.index(
		organizationSlug,
		businessId,
	);
	const items = [
		{
			href: conversationsHref,
			icon: IconMessageCircle,
			isActive:
				pathname === conversationsHref ||
				pathname.startsWith(`${conversationsHref}/`),
			label: "Conversations",
		},
		...(canManageMemberships
			? [
					{
						href: membersHref,
						icon: IconUsers,
						isActive: pathname === membersHref,
						label: "Members",
					},
				]
			: []),
		...(canManageBusinesses
			? [
					{
						href: settingsHref,
						icon: IconSettings,
						isActive: pathname === settingsHref,
						label: "Settings",
					},
				]
			: []),
	];

	return (
		<PageContainer>
			<PageSidebarLayout
				sidebar={
					<nav
						aria-label="Business"
						className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0"
					>
						{items.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								aria-current={item.isActive ? "page" : undefined}
								className={cn(
									buttonVariants({
										variant: item.isActive ? "secondary" : "ghost",
										size: "sm",
									}),
									"justify-start md:w-full",
								)}
							>
								<item.icon data-icon="inline-start" />
								{item.label}
							</Link>
						))}
					</nav>
				}
			>
				{children}
			</PageSidebarLayout>
		</PageContainer>
	);
}
