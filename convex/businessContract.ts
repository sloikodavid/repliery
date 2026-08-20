export const businessSorts = {
	newest: "newest",
	oldest: "oldest",
} as const;

export type BusinessSort = (typeof businessSorts)[keyof typeof businessSorts];
