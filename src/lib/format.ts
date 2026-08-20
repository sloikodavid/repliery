const dateFormatter = new Intl.DateTimeFormat("en", {
	dateStyle: "medium",
});

export function formatDate(timestamp: number) {
	return dateFormatter.format(timestamp);
}
