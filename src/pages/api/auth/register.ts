import { lucia } from '../../../lib/auth';
import { generateIdFromEntropySize } from 'lucia';
import type { APIContext } from 'astro';
import { db, userTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();

	const username = formData.get('username');
	// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
	// keep in mind some database (e.g. mysql) are case insensitive
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
		return new Response(JSON.stringify({ error: 'Invalid email, must be a valid email' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1).execute();
	if (existingUser.length > 0) {
		return new Response(JSON.stringify({ error: 'Email already in use' }), {
			status: 409,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const password = formData.get('password');
	if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
		return new Response(JSON.stringify({ error: 'Invalid password, must be between 6 ~ 255 characters' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const confirmPassword = formData.get('confirm_password');
	if (password !== confirmPassword) {
		return new Response(JSON.stringify({ error: 'Password and confirm password do not match' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const userId = generateIdFromEntropySize(10); // 16 characters long

	const passwordHash = await Bun.password.hash(password, {
		// recommended minimum parameters
		algorithm: 'argon2id', // "argon2id" | "argon2i" | "argon2d"
		memoryCost: 4, // memory usage in kibibytes
		timeCost: 3,
	});

	await db.insert(userTable).values({
		id: userId,
		username: username,
		email: email,
		password: passwordHash,
		createdAt: new Date(),
	});

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return context.redirect('/dashboard');
}
