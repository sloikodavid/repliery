"use client";

import { IconSearch } from "@tabler/icons-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type BusinessSort,
	businessSorts,
} from "../../../shared/business-contract";

const businessSortItems = [
	{ id: businessSorts.newest, label: "Newest first" },
	{ id: businessSorts.oldest, label: "Oldest first" },
] as const;
const relevanceSortItems = [{ id: "relevance", label: "Relevance" }] as const;

export function BusinessListControls({
	search,
	sort,
	onSearchChange,
	onSortChange,
}: {
	search: string;
	sort: BusinessSort;
	onSearchChange: (search: string) => void;
	onSortChange: (sort: BusinessSort) => void;
}) {
	const isSearching = search.trim().length > 0;
	const sortItems = isSearching ? relevanceSortItems : businessSortItems;
	return (
		<div className="space-y-2">
			<InputGroup>
				<InputGroupAddon>
					<IconSearch />
				</InputGroupAddon>
				<InputGroupInput
					type="search"
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					aria-label="Search businesses"
					placeholder="Search businesses"
					maxLength={80}
				/>
			</InputGroup>
			<Select
				aria-label="Sort businesses"
				selectedKey={isSearching ? "relevance" : sort}
				isDisabled={isSearching}
				onSelectionChange={(key) => {
					if (key === businessSorts.newest || key === businessSorts.oldest) {
						onSortChange(key);
					}
				}}
				className="w-full"
			>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{sortItems.map((item) => (
						<SelectItem key={item.id} id={item.id}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
