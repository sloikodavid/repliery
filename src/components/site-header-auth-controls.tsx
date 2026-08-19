"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
export function SiteHeaderAuthControls() {
	return (
		<div className="flex min-w-0 items-center gap-2 max-[359px]:gap-1">
			<OrganizationSwitcher hidePersonal />
			<UserButton />
		</div>
	);
}
