import type { APIContext } from 'astro';
import { db, userTable, sessionTable } from '../../../config/db';
import { eq } from 'drizzle-orm';

interface User {
	id: string;
	username: string;
	email: string;
}

export async function POST(context: APIContext): Promise<Response> {
	const user = context.locals.user as User | null;
	if (!user) {
		return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const userId = user.id;

	await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
    
	context.cookies.delete('session');
    
	await db.delete(userTable).where(eq(userTable.id, userId));

	return context.redirect('/auth/login');
}
