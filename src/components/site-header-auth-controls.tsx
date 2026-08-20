"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { routes } from "@/lib/routes";

export function SiteHeaderAuthControls() {
	return (
		<div className="flex min-w-0 items-center gap-2 max-[359px]:gap-1">
			<OrganizationSwitcher
				hidePersonal
				afterCreateOrganizationUrl={routes.organizations.bySlugTemplate}
				afterLeaveOrganizationUrl={routes.organizations.index}
				afterSelectOrganizationUrl={routes.organizations.bySlugTemplate}
			/>
			<UserButton />
		</div>
	);
}
