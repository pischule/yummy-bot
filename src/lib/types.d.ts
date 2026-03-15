interface Item {
	name: string;
	qty: number;
}

interface Order {
	name: string;
	orderedItems: {
		name: string;
		qty: number;
	}[];
}
