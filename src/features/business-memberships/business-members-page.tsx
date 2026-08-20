"use client";

import { useOrganization } from "@clerk/nextjs";
import {
	IconPlus,
	IconTrash,
	IconUserPlus,
	IconUsers,
} from "@tabler/icons-react";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageEmptyState } from "@/components/page-empty-state";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { clerkPermissions } from "../../../convex/clerkContract";

const emptyMembersDescription =
	"Members with organization-wide business access still have access. Add members who need access through this business specifically.";
const organizationWideAccessTooltip =
	"This member will retain organization-wide business access even after this Business Membership is removed.";

export function BusinessMembersPage({ businessId }: { businessId: string }) {
	const typedBusinessId = businessId as Id<"businesses">;
	const {
		results: businessMemberships,
		status: businessMembershipsStatus,
		loadMore: loadMoreBusinessMemberships,
	} = usePaginatedQuery(
		api.businessMemberships.list,
		{ businessId: typedBusinessId },
		{ initialNumItems: 20 },
	);
	const removeMembership = useMutation(api.businessMemberships.remove);
	const { memberships: organizationMemberships } = useOrganization({
		memberships: {
			infinite: true,
			keepPreviousData: true,
			pageSize: 100,
		},
	});
	const organizationMembershipById = useMemo(
		() =>
			new Map(
				organizationMemberships?.data?.map((membership) => [
					membership.id,
					membership,
				]) ?? [],
			),
		[organizationMemberships?.data],
	);

	if (
		businessMembershipsStatus === "LoadingFirstPage" ||
		!organizationMemberships
	) {
		return <PageHeader title="Members" />;
	}

	async function handleRemove(businessMembershipId: Id<"businessMemberships">) {
		try {
			await removeMembership({
				businessId: typedBusinessId,
				businessMembershipId,
			});
			toast.success("Member removed from business");
		} catch {
			toast.error("The member could not be removed. Refresh and try again.");
		}
	}

	return (
		<section className="space-y-4">
			<PageHeader
				title="Members"
				actions={
					<AddBusinessMember
						businessId={typedBusinessId}
						assignedMembershipIds={
							new Set(
								businessMemberships.map(
									(membership) => membership.clerkOrganizationMembershipId,
								),
							)
						}
						organizationMemberships={organizationMemberships}
					/>
				}
			/>

			{businessMemberships.length === 0 ? (
				<PageEmptyState
					icon={<IconUsers />}
					title="No business members"
					description={emptyMembersDescription}
				/>
			) : (
				<div className="space-y-4">
					<Table aria-label="Business members">
						<TableHeader>
							<TableHead isRowHeader>Name</TableHead>
							<TableHead>Added</TableHead>
							<TableHead className="w-0">
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableHeader>
						<TableBody>
							{businessMemberships.map((businessMembership) => {
								const organizationMembership = organizationMembershipById.get(
									businessMembership.clerkOrganizationMembershipId,
								);
								const userData = organizationMembership?.publicUserData;
								const displayName = userData
									? [userData.firstName, userData.lastName]
											.filter(Boolean)
											.join(" ") || userData.identifier
									: businessMembership.clerkUserId;
								return (
									<TableRow
										key={businessMembership._id}
										id={businessMembership._id}
									>
										<TableCell>
											<div className="flex min-w-48 items-center gap-2">
												<Avatar size="sm">
													{userData?.imageUrl ? (
														<AvatarImage src={userData.imageUrl} alt="" />
													) : null}
													<AvatarFallback>
														{displayName.slice(0, 1).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0">
													<div className="truncate font-medium">
														{displayName}
													</div>
													{userData ? (
														<div className="truncate text-muted-foreground">
															{userData.identifier}
														</div>
													) : null}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<time
												dateTime={new Date(
													businessMembership._creationTime,
												).toISOString()}
											>
												{formatDate(businessMembership._creationTime)}
											</time>
										</TableCell>
										<TableCell className="text-right">
											<RemoveBusinessMember
												hasOrganizationWideBusinessAccess={
													organizationMembership?.permissions.includes(
														clerkPermissions.manageBusinesses,
													) ?? false
												}
												onRemove={() => handleRemove(businessMembership._id)}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					{businessMembershipsStatus === "CanLoadMore" ? (
						<Button
							variant="outline"
							onPress={() => loadMoreBusinessMemberships(20)}
						>
							Load more members
						</Button>
					) : null}
				</div>
			)}
		</section>
	);
}

type OrganizationMemberships = NonNullable<
	ReturnType<
		typeof useOrganization<{ memberships: { infinite: true } }>
	>["memberships"]
>;

function AddBusinessMember({
	businessId,
	assignedMembershipIds,
	organizationMemberships,
}: {
	businessId: Id<"businesses">;
	assignedMembershipIds: Set<string>;
	organizationMemberships: OrganizationMemberships;
}) {
	const addMembership = useAction(api.businessMembershipsActions.add);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedMembershipId, setSelectedMembershipId] = useState<
		string | null
	>(null);
	const [isPending, setIsPending] = useState(false);
	const availableMemberships =
		organizationMemberships.data?.filter(
			(membership) => !assignedMembershipIds.has(membership.id),
		) ?? [];

	async function handleAdd() {
		const membership = availableMemberships.find(
			(candidate) => candidate.id === selectedMembershipId,
		);
		const clerkUserId = membership?.publicUserData?.userId;
		if (!membership || !clerkUserId) {
			return;
		}
		setIsPending(true);
		try {
			await addMembership({
				businessId,
				clerkOrganizationMembershipId: membership.id,
				clerkUserId,
			});
			setSelectedMembershipId(null);
			setIsOpen(false);
			toast.success("Member added to business");
		} catch {
			toast.error("The member could not be added. Refresh and try again.");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			<Button>
				<IconPlus data-icon="inline-start" />
				Add member
			</Button>
			<Dialog>
				<DialogHeader>
					<DialogTitle>Add member</DialogTitle>
					<DialogDescription>
						Choose an existing member of this organization.
					</DialogDescription>
				</DialogHeader>
				<Combobox
					aria-label="Organization member"
					selectedKey={selectedMembershipId}
					onSelectionChange={(key) =>
						setSelectedMembershipId(key?.toString() ?? null)
					}
				>
					<ComboboxInput placeholder="Search organization members" />
					<ComboboxContent>
						<ComboboxList>
							{availableMemberships.map((membership) => {
								const userData = membership.publicUserData;
								if (!userData) {
									return null;
								}
								const name = [userData.firstName, userData.lastName]
									.filter(Boolean)
									.join(" ");
								return (
									<ComboboxItem
										key={membership.id}
										id={membership.id}
										textValue={`${name} ${userData.identifier}`}
									>
										<Avatar size="sm">
											<AvatarImage src={userData.imageUrl} alt="" />
											<AvatarFallback>
												{(name || userData.identifier)
													.slice(0, 1)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="min-w-0">
											<span className="block truncate font-medium">
												{name || userData.identifier}
											</span>
											<span className="block truncate text-muted-foreground">
												{userData.identifier}
											</span>
										</span>
									</ComboboxItem>
								);
							})}
						</ComboboxList>
						<ComboboxEmpty>No available members.</ComboboxEmpty>
					</ComboboxContent>
				</Combobox>
				{organizationMemberships.hasNextPage ? (
					<Button
						variant="ghost"
						onPress={() => void organizationMemberships.fetchNext()}
					>
						Load more organization members
					</Button>
				) : null}
				<DialogFooter showCloseButton>
					<Button
						isDisabled={!selectedMembershipId}
						isPending={isPending}
						onPress={() => void handleAdd()}
					>
						<IconUserPlus data-icon="inline-start" />
						Add member
					</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	);
}

function RemoveBusinessMember({
	hasOrganizationWideBusinessAccess,
	onRemove,
}: {
	hasOrganizationWideBusinessAccess: boolean;
	onRemove: () => Promise<void>;
}) {
	const trigger = (
		<Button variant="ghost" size="icon-sm" aria-label="Remove member">
			<IconTrash />
		</Button>
	);

	return (
		<AlertDialogTrigger>
			{hasOrganizationWideBusinessAccess ? (
				<TooltipTrigger>
					{trigger}
					<Tooltip>{organizationWideAccessTooltip}</Tooltip>
				</TooltipTrigger>
			) : (
				trigger
			)}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<IconTrash />
					</AlertDialogMedia>
					<AlertDialogTitle>Remove this member?</AlertDialogTitle>
					<AlertDialogDescription>
						{hasOrganizationWideBusinessAccess
							? "This removes the Business Membership, but the person will retain organization-wide business access."
							: "They will immediately lose access granted by this Business Membership."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onPress={() => void onRemove()}
					>
						Remove member
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialogTrigger>
	);
}
