import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function Page() {
	const authentication = await auth();
	if (!authentication.isAuthenticated) {
		await authentication.redirectToSignIn({
			returnBackUrl: routes.organizations.index,
		});
	}
	if (!authentication.orgSlug) {
		redirect(routes.root);
	}
	redirect(routes.organizations.bySlug(authentication.orgSlug));
}
