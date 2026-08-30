import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/server/logger';
import { storeSessionToCookie, validateWebAppInitData } from '$lib/server/auth';

type Scope = {
	roles: Role[];
	cookiePath: string;
};

function resolveScope(target: string): Scope | null {
	const segments = target.split('/').filter(Boolean);
	if (segments[0] === '_' && segments[1] === 'edit' && segments.length === 2) {
		return { roles: ['admin'], cookiePath: '/_/edit' };
	}
	if (segments[0] === 'order' && segments.length === 2 && segments[1] !== '') {
		return { roles: ['user'], cookiePath: '/order' };
	}
	return null;
}

export const POST: RequestHandler = async ({ request, params, cookies }) => {
	const target = params.target ?? '';

	const scope = resolveScope(target);
	if (scope == null) {
		return json({ ok: false }, { status: 404 });
	}

	let initData = '';
	let version = '';
	let platform = '';
	let userAgent = request.headers.get('User-Agent');
	try {
		const body = (await request.json()) as {
			initData?: unknown;
			version: string;
			platform: string;
		};
		initData = typeof body.initData === 'string' ? body.initData : '';
		version = body.version;
		platform = body.platform;
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	if (!initData) {
		return json({ ok: false }, { status: 400 });
	}

	const session = await validateWebAppInitData(initData, scope.roles);
	if (session == null) {
		return json({ ok: false }, { status: 401 });
	}

	storeSessionToCookie(session, cookies, scope.cookiePath);

	logger.info(
		{ userId: session.tgId, roles: scope.roles, target, version, platform, userAgent },
		'Mini-app login succeeded'
	);

	return json({ ok: true, redirectTo: `/${target}` });
};
