"use client";

import { IconTrash } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { routes } from "@/lib/routes";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const deleteBusinessDescription =
	"This starts permanent deletion of its memberships and conversations. Access ends immediately, and this cannot be undone.";
const deleteBusinessConfirmation =
	"The business will be hidden immediately and permanently deleted in the background. This cannot be undone.";

export function BusinessSettingsPage({
	organizationSlug,
	businessId,
}: {
	organizationSlug: string;
	businessId: string;
}) {
	const router = useRouter();
	const requestBusinessDeletion = useMutation(api.businesses.requestDeletion);

	async function handleDelete() {
		try {
			await requestBusinessDeletion({
				businessId: businessId as Id<"businesses">,
			});
			toast.success("Business deletion started");
			router.replace(routes.businesses.index(organizationSlug));
		} catch {
			toast.error("The business could not be deleted. Refresh and try again.");
		}
	}

	return (
		<section aria-label="Business settings" className="space-y-4">
			<PageHeader title="Settings" />
			<Item variant="outline">
				<ItemContent>
					<ItemTitle>Delete business</ItemTitle>
					<ItemDescription>{deleteBusinessDescription}</ItemDescription>
				</ItemContent>
				<ItemActions>
					<AlertDialogTrigger>
						<Button variant="destructive" aria-label="Delete business">
							<IconTrash data-icon="inline-start" />
							Delete
						</Button>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogMedia>
									<IconTrash />
								</AlertDialogMedia>
								<AlertDialogTitle>Delete this business?</AlertDialogTitle>
								<AlertDialogDescription>
									{deleteBusinessConfirmation}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onPress={() => void handleDelete()}
								>
									Delete business
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialogTrigger>
				</ItemActions>
			</Item>
		</section>
	);
}
