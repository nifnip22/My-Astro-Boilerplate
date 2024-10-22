import type { APIContext } from 'astro';
import { db, userTable, sessionTable, emailVerificationCodeTable, passwordResetTokensTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';

interface User {
	id: string;
	username: string;
	email: string;
}

export async function POST(context: APIContext): Promise<Response> {
	try {
		const user = context.locals.user as User | null;
		if (!user) {
			return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		const formData = await context.request.formData();

		const password = formData.get('password');

		if (typeof password !== 'string') {
			return new Response(JSON.stringify({ error: 'Invalid input' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		const userRecord = await db.select().from(userTable).where(eq(userTable.id, user.id)).limit(1);

		if (userRecord.length === 0) {
			return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		const userHashedPassword = userRecord[0].password;

		const passwordMatch = await Bun.password.verify(password, userHashedPassword);
		if (!passwordMatch) {
			return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
				status: 403,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		const userId = user.id;

		await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, userId));

		await db.delete(emailVerificationCodeTable).where(eq(emailVerificationCodeTable.userId, userId));

		await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

		context.cookies.delete('session');

		await db.delete(userTable).where(eq(userTable.id, userId));

		return context.redirect('/auth/login');
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Something went wrong' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}
