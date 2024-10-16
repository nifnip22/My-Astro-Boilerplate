import { generateEmailVerificationCode, lucia } from '../../../lib/auth';
import { generateIdFromEntropySize } from 'lucia';
import type { APIContext } from 'astro';
import { db, userTable } from '../../../lib/db';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

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
		emailVerified: false,
		password: passwordHash,
		createdAt: new Date(),
	});

	const verificationCode = await generateEmailVerificationCode(userId, email);
	await sendVerificationCode(email, verificationCode);

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);

	return new Response(JSON.stringify({ success: 'Email verification in process, please wait' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': sessionCookie.serialize(),
		},
	});
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		host: import.meta.env.SMTP_HOST,
		port: import.meta.env.SMTP_PORT,
		secure: true,
		auth: {
			user: import.meta.env.SMTP_USER,
			pass: import.meta.env.SMTP_APP_PASSWORD,
		},
		debug: true,
	});

	const mailOptions = {
		from: 'h.nifnip22@gmail.com',
		to: email,
		subject: 'Astro Boilerplate - Email Verification',
		text: `Your verification code is: ${code}`,
		html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Astro Boilerplate - Email Verification</h2>
            <p style="color: #333;">Hello,</p>
            <p style="color: #333;">Your verification code is: <strong style="color: #007bff;">${code}</strong></p>
            <p style="color: #333;">Please use this code to verify your email. This code will expire in 15 minutes after this email was sent.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999;">If you did not request this email, please ignore it.</p>
        </div>`,
	};

	try {
		await transporter.sendMail(mailOptions);
		// console.log('Verification email sent successfully');
	} catch (error) {
		console.error('Error sending verification email:', error);
		throw new Error('Failed to send verification email');
	}
}
