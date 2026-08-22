import { Spinner } from "@/components/ui/spinner";

export function PageLoadingState({ label = "Loading" }: { label?: string }) {
	return (
		<div className="flex min-h-56 items-center justify-center">
			<Spinner aria-label={label} />
		</div>
	);
}
