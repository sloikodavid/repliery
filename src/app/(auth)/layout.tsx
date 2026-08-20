import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function AuthLayout({
	children,
}: React.PropsWithChildren) {
	const authentication = await auth();
	if (authentication.isAuthenticated) {
		redirect(routes.organizations.index);
	}

	return (
		<main className="grid w-full flex-1 place-items-center px-4 py-8">
			{children}
		</main>
	);
}
