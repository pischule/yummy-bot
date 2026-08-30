// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			botUsername?: string;
			linkId?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		Telegram?: {
			WebApp?: {
				initData: string;
				version: string;
				platform: string;
				ready: () => void;
				expand: () => void;
			};
		};
	}
}

export {};
