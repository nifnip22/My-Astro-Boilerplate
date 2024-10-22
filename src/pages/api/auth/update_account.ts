import type { APIContext } from 'astro';
import { db, userTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';
import { generateEmailVerificationCode } from '@/lib/auth';
import { sendVerificationCode } from './register';

interface User {
	id: string;
	username: string;
	email: string;
	emailVerified: any;
	updated_at: Date;
}

export async function POST(context: APIContext): Promise<Response> {
	try {
		const formData = await context.request.formData();

		const username = formData.get('username');
		if (typeof username !== 'string' || username.length < 3 || username.length > 30) {
			return new Response(JSON.stringify({ error: 'Invalid username, must be between 4 ~ 30 characters' }), {
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

		let updateData = {
			username: username,
			email: email,
			emailVerified: user.email.toLowerCase() !== email.toLowerCase() ? false : user.emailVerified,
			updatedAt: new Date(),
		};

		if (user.email.toLowerCase() !== email.toLowerCase()) {
			const verificationCode = await generateEmailVerificationCode(userId, email);
			await sendVerificationCode(email, verificationCode);
		}

		await db.update(userTable).set(updateData).where(eq(userTable.id, userId));

		return context.redirect('/auth/email-verification');
	} catch (error) {
		return new Response(JSON.stringify({ error: 'An error occurred while updating your account' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}
