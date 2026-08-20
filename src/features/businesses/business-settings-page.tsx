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

const removeBusinessDescription =
	"This also removes its memberships and conversations. This cannot be undone.";
const removeBusinessConfirmation =
	"The business, its memberships, and its conversations will be removed immediately. This cannot be undone.";

export function BusinessSettingsPage({
	organizationSlug,
	businessId,
}: {
	organizationSlug: string;
	businessId: string;
}) {
	const router = useRouter();
	const removeBusiness = useMutation(api.businesses.remove);

	async function handleRemove() {
		try {
			await removeBusiness({ businessId: businessId as Id<"businesses"> });
			toast.success("Business removed");
			router.replace(routes.businesses.index(organizationSlug));
		} catch {
			toast.error("The business could not be removed. Refresh and try again.");
		}
	}

	return (
		<section aria-label="Business settings" className="space-y-4">
			<PageHeader title="Settings" />
			<Item variant="outline">
				<ItemContent>
					<ItemTitle>Remove business</ItemTitle>
					<ItemDescription>{removeBusinessDescription}</ItemDescription>
				</ItemContent>
				<ItemActions>
					<AlertDialogTrigger>
						<Button variant="destructive" aria-label="Remove business">
							<IconTrash data-icon="inline-start" />
							Remove
						</Button>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogMedia>
									<IconTrash />
								</AlertDialogMedia>
								<AlertDialogTitle>Remove this business?</AlertDialogTitle>
								<AlertDialogDescription>
									{removeBusinessConfirmation}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onPress={() => void handleRemove()}
								>
									Remove business
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialogTrigger>
				</ItemActions>
			</Item>
		</section>
	);
}
