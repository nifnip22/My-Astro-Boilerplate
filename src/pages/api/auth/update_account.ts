import type { APIContext } from 'astro';
import { db, userTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';

interface User {
	id: string;
	username: string;
	email: string;
	updated_at: Date;
}

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();

	const username = formData.get('username');
	if (typeof username !== 'string' || username.length < 3 || username.length > 31) {
		return new Response(JSON.stringify({ error: 'Invalid username, must be between 4 ~ 31 characters' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const email = formData.get('email');
	if (typeof email !== 'string' || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
		return new Response(JSON.stringify({ error: 'Invalid email' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

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

	const existingUser = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).execute();
	if (existingUser.length > 0 && existingUser[0].id !== userId) {
		return new Response(JSON.stringify({ error: 'Email is already in use by another account' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	await db
		.update(userTable)
		.set({
			username: username,
			email: email,
			updatedAt: new Date(),
		})
		.where(eq(userTable.id, userId));

	return context.redirect('/profile');
}
