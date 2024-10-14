import { generateIdFromEntropySize, Lucia } from 'lucia';
import { DrizzleMySQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db, sessionTable, userTable, emailVerificationCodeTable } from './db';
import { TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/crypto";
import { eq } from 'drizzle-orm';

const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable); // your adapter

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
	await db.delete(emailVerificationCodeTable).where(eq(emailVerificationCodeTable.userId, userId));
	const id = generateIdFromEntropySize(10);
	const code = generateRandomString(6, alphabet("0-9", "A-Z"));
	await db.insert(emailVerificationCodeTable).values({
		id: id,
		code: code,
		userId: userId,
		email: email,
		expiresAt: createDate(new TimeSpan(15, "m")) // 15 minutes
	});
	return code;
}

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD,
		},
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username,
			email: attributes.email,
			emailVerified: attributes.emailVerified,
		};
	}
});

// IMPORTANT!
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	email: string;
	emailVerified: boolean;
}