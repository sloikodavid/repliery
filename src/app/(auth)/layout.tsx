export default function AuthLayout({ children }: React.PropsWithChildren) {
	return (
		<main className="grid w-full flex-1 place-items-center px-4 py-8">
			{children}
		</main>
	);
}
