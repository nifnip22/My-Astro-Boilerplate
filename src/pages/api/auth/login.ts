import { lucia } from '../../../lib/auth';
import type { APIContext } from 'astro';
import { db, userTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();

	const email = formData.get('email');
	if (typeof email !== 'string' || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
		return new Response(JSON.stringify({ error: 'Invalid email' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const password = formData.get('password');
	if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
		return new Response(JSON.stringify({ error: 'Invalid password' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const existingUser = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).execute();
	if (!existingUser || existingUser.length === 0) {
		return new Response(JSON.stringify({ error: 'Incorrect username or password' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const userId = existingUser[0].id;
	const passwordHash = existingUser[0].password;

	const validPassword = await Bun.password.verify(password, passwordHash);

	if (!validPassword) {
		return new Response(JSON.stringify({ error: 'Incorrect username or password' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return context.redirect('/dashboard');
}
