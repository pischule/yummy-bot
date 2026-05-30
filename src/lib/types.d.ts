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

type Role = 'admin' | 'user';

interface Session {
	tgId: number;
	roles: Role[];
	// epoch milli until which the session is valid
	validUntil: number;
}
