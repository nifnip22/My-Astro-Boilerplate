import { lucia } from '@/lib/auth';
import { db, passwordResetTokensTable, userTable } from '@/lib/db';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { isWithinExpirationDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';

export async function GET(context: APIContext): Promise<Response> {
	const { params } = context;
	const token = params.token;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Token is missing' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: `/auth/reset-password/${token}`,
			'Referrer-Policy': 'strict-origin',
		},
	});
}

export async function POST(context: APIContext): Promise<Response> {
	try {
		const { params } = context;
		const formData = await context.request.formData();

		const password = formData.get('password');
		if (typeof password !== 'string' || password.length < 8 || password.length > 20) {
			return new Response(JSON.stringify('Invalid password, must be between 8 ~ 20 characters'), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		const verificationToken = params.token;

		const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
		const token = await db.select().from(passwordResetTokensTable).where(eq(passwordResetTokensTable.tokenHash, tokenHash)).limit(1).execute();
		if (token) {
			await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.tokenHash, tokenHash));
		}

		const expires = token[0].expiresAt;
		const userId = token[0].userId;

		if (!token || !isWithinExpirationDate(expires)) {
			return new Response(JSON.stringify({ error: 'Invalid token' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		await lucia.invalidateUserSessions(userId);
		const passwordHash = await Bun.password.hash(password, {
			algorithm: 'argon2id',
			memoryCost: 4,
			timeCost: 3,
		});

		await db.update(userTable).set({ password: passwordHash }).where(eq(userTable.id, userId)).execute();

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/dashboard',
				'Set-Cookie': sessionCookie.serialize(),
				'Referrer-Policy': 'strict-origin',
			},
		});
	} catch (error) {
        return new Response(JSON.stringify({ error: 'Unexpected error occurred'}), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }
}
