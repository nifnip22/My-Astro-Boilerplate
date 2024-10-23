import { generateEmailVerificationCode } from '@/lib/auth';
import type { APIContext } from 'astro';
import type { User } from 'lucia';
import { sendVerificationCode } from './register';

export async function POST(context: APIContext): Promise<Response> {
	if (!context.locals.session) {
		return new Response(null, {
			status: 401,
		});
	}

	const user = context.locals.user as User | null;
	if (!user) {
		return new Response(null, {
			status: 401,
		});
	}

	const userId = user.id;
	const email = user.email;

	const verificationCode = await generateEmailVerificationCode(userId, email);

	try {
		await sendVerificationCode(email, verificationCode);

        return new Response(JSON.stringify({ message: 'Verification code resent successfully' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Email verification failed' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
