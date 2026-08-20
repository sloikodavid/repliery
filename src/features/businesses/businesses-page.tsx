"use client";

import { useAuth } from "@clerk/nextjs";
import { IconBuilding, IconPlus, IconSearch } from "@tabler/icons-react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/page-container";
import { PageEmptyState } from "@/components/page-empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSidebarLayout } from "@/components/page-sidebar-layout";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { BusinessListControls } from "@/features/businesses/business-list-controls";
import {
	getBusinessNavigationHref,
	useBusinessNavigation,
} from "@/features/businesses/business-navigation";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { api } from "../../../convex/_generated/api";
import {
	type BusinessSort,
	businessSorts,
} from "../../../convex/businessContract";
import { clerkPermissions } from "../../../convex/clerkContract";

export function BusinessesPage({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const { has, orgId } = useAuth();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<BusinessSort>(businessSorts.newest);
	const navigation = useBusinessNavigation(orgId ?? null);
	const canManageBusinesses = Boolean(
		has?.({ permission: clerkPermissions.manageBusinesses }),
	);
	const { results, status, loadMore } = usePaginatedQuery(
		api.businesses.list,
		navigation?.kind === "businesses"
			? {
					search: canManageBusinesses ? search : "",
					sort: canManageBusinesses ? sort : businessSorts.newest,
				}
			: "skip",
		{ initialNumItems: 20 },
	);
	useEffect(() => {
		if (navigation?.kind === "business") {
			router.replace(getBusinessNavigationHref(organizationSlug, navigation));
		} else if (navigation === null) {
			router.replace(routes.root);
		}
	}, [navigation, organizationSlug, router]);

	if (!navigation || navigation.kind === "business") {
		return null;
	}
	const isSearching = search.trim().length > 0;
	const content = (
		<section className="space-y-4">
			<PageHeader
				title="Businesses"
				actions={
					canManageBusinesses ? (
						<CreateBusiness organizationSlug={organizationSlug} />
					) : null
				}
			/>
			{status === "LoadingFirstPage" ? null : results.length === 0 ? (
				<PageEmptyState
					icon={isSearching ? <IconSearch /> : <IconBuilding />}
					title={isSearching ? "No matching businesses" : "No businesses yet"}
					description={
						isSearching
							? "Try a different business name."
							: canManageBusinesses
								? "Add the first business for this organization."
								: "You have not been added to a business in this organization."
					}
				/>
			) : (
				<div className="space-y-4">
					<Table aria-label="Businesses">
						<TableHeader>
							<TableHead isRowHeader>Name</TableHead>
							<TableHead className="w-0 text-right">Created</TableHead>
						</TableHeader>
						<TableBody>
							{results.map((business) => (
								<TableRow
									key={business._id}
									id={business._id}
									href={routes.businesses.byId(organizationSlug, business._id)}
									textValue={business.name}
									className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
								>
									<TableCell className="font-medium">{business.name}</TableCell>
									<TableCell className="text-right">
										<time
											dateTime={new Date(business._creationTime).toISOString()}
										>
											{formatDate(business._creationTime)}
										</time>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{status === "CanLoadMore" ? (
						<Button variant="outline" onPress={() => loadMore(20)}>
							Load more
						</Button>
					) : null}
				</div>
			)}
		</section>
	);

	return (
		<PageContainer>
			{canManageBusinesses ? (
				<PageSidebarLayout
					sidebar={
						<BusinessListControls
							search={search}
							sort={sort}
							onSearchChange={setSearch}
							onSortChange={setSort}
						/>
					}
				>
					{content}
				</PageSidebarLayout>
			) : (
				content
			)}
		</PageContainer>
	);
}

function CreateBusiness({ organizationSlug }: { organizationSlug: string }) {
	const createBusiness = useMutation(api.businesses.create);
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const name = new FormData(form).get("name")?.toString() ?? "";
		setError(null);
		setIsPending(true);
		try {
			const businessId = await createBusiness({ name });
			setIsOpen(false);
			form.reset();
			toast.success("Business added", {
				action: {
					label: "Open",
					onClick: () => {
						window.location.assign(
							routes.businesses.byId(organizationSlug, businessId),
						);
					},
				},
			});
		} catch {
			setError(
				"The business could not be added. Check the name and try again.",
			);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			<Button>
				<IconPlus data-icon="inline-start" />
				Add business
			</Button>
			<Dialog>
				<form onSubmit={handleSubmit} className="contents">
					<DialogHeader>
						<DialogTitle>Add business</DialogTitle>
						<DialogDescription>
							Create a business inside the active organization.
						</DialogDescription>
					</DialogHeader>
					<Field data-invalid={Boolean(error)}>
						<FieldLabel htmlFor="business-name">Name</FieldLabel>
						<Input
							id="business-name"
							name="name"
							maxLength={80}
							required
							autoFocus
							aria-invalid={Boolean(error)}
						/>
						<FieldError>{error}</FieldError>
					</Field>
					<DialogFooter showCloseButton>
						<Button type="submit" isPending={isPending}>
							Add business
						</Button>
					</DialogFooter>
				</form>
			</Dialog>
		</DialogTrigger>
	);
}
