import { createPasswordResetToken } from '@/lib/auth';
import { db, userTable } from '@/lib/db';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

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

	const user = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).limit(1).execute();
	if (user.length === 0) {
		return new Response(JSON.stringify({ error: 'User not found' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const userId = user[0].id;
	const verificationToken = await createPasswordResetToken(userId);
	const verificationLink = 'http://localhost:4321/auth/reset-password/' + verificationToken;

	await sendPasswordResetToken(email, verificationLink);

	return new Response(JSON.stringify({ message: 'Password reset email successfully sent' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

async function sendPasswordResetToken(email: string, verificationLink: string): Promise<void> {
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
		subject: 'Astro Boilerplate - Password Reset',
		text: 'Click the link below to reset your password',
		html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Astro Boilerplate - Password Reset</h2>
            <p style="color: #333;">Hello,</p>
            <p style="color: #333;">Click the link below to reset your password</p>
            <p style="color: #333;"><a href="${verificationLink}">${verificationLink}</a></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999;">If you did not request this email, please ignore it.</p>
        </div>`,
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw new Error('Failed to send password reset email');
	}
}
