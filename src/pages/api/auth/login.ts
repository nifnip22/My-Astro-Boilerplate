import { lucia } from '../../../config/auth';
import type { APIContext } from 'astro';
import { db, userTable } from '../../../config/db';
import { eq } from 'drizzle-orm';

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();

	const email = formData.get('email');
	if (typeof email !== 'string' || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
		return new Response('Invalid email', {
			status: 400,
		});
	}

	const password = formData.get('password');
	if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
		return new Response('Invalid password', {
			status: 400,
		});
	}

	const existingUser = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).execute();
	if (!existingUser) {
		return new Response('Incorrect username or password', {
			status: 400,
		});
	}

	const userId = existingUser[0].id;
	const passwordHash = existingUser[0].password;

	const validPassword = await Bun.password.verify(password, passwordHash);

	if (!validPassword) {
		return new Response('Incorrect username or password', {
			status: 400,
		});
	}

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return context.redirect('/dashboard');
}
