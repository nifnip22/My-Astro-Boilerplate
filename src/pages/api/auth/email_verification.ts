import { isWithinExpirationDate } from "oslo";
import type { User } from "lucia";
import type { APIContext } from 'astro';
import { db, emailVerificationCodeTable, userTable } from '../../../lib/db';
import { lucia } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();

    if (!context.locals.session) {
		return new Response(null, {
			status: 401,
		});
	}

    const { user } = await lucia.validateSession(context.locals.session.id);
	if (!user) {
		return new Response(null, {
			status: 401
		});
	}

    const code = formData.get("code");
	if (typeof code !== "string") {
		return new Response(JSON.stringify({ error: "The code must be a string" }), {
			status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
		});
	}

	const validCode = await verifyVerificationCode(user, code);
	if (!validCode) {
		return new Response(JSON.stringify({ error: "Invalid verification code" }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			}
		});
	}

    await lucia.invalidateUserSessions(user.id);
    await db.update(userTable).set({ emailVerified: true }).where(eq(userTable.id, user.id));
    const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);

    return new Response(null, {
		status: 302,
		headers: {
			Location: "/dashboard",
			"Set-Cookie": sessionCookie.serialize()
		}
	});
}

export async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
    const result = await db.transaction(async (tx) => {
        const [databaseCode] = await tx.select().from(emailVerificationCodeTable).where(eq(emailVerificationCodeTable.userId, user.id)).limit(1).execute();

        if (!databaseCode || databaseCode.code !== code) {
            return false;
        }

        await tx.delete(emailVerificationCodeTable).where(eq(emailVerificationCodeTable.userId, databaseCode.id));

        if (!isWithinExpirationDate(databaseCode.expiresAt)) {
            return false;
        }

        if (databaseCode.email !== user.email) {
            return false;
        }

        return true;
    });

    return result;
}