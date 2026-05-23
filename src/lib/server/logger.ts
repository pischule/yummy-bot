import Pino from 'pino';

const isDevMode = import.meta.env.DEV;

export const logger = Pino(
	isDevMode
		? {
				transport: {
					target: 'pino-pretty'
				}
			}
		: {}
);
