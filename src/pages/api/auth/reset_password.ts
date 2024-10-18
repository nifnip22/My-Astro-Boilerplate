import { createPasswordResetToken } from "@/lib/auth";
import { db, userTable } from "@/lib/db";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";

export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();
    const email = formData.get('email');

    if (typeof email !== 'string' || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    const user = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).limit(1).execute();
    if (user.length === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    const userId = user[0].id;
    const verificationToken = await createPasswordResetToken(userId);
    const verificationLink = "http://localhost:3000/reset-password/" + verificationToken;

    console.log("Email: " + email);
    console.log("Verification Link: " + verificationLink);
    // await sendPasswordResetToken(email, verificationLink);

    return new Response(null, {
        status: 200
    });
}