import type { APIContext } from 'astro';
import { db, userTable } from '../../../config/db';
import { eq } from 'drizzle-orm';

export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();

    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid input' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    if (newPassword.length < 6 || newPassword.length > 255) {
        return new Response(JSON.stringify({ error: 'New password must be between 6 and 255 characters' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    if (newPassword !== confirmPassword) {
        return new Response(JSON.stringify({ error: 'New password and confirm password do not match' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const userId = context.locals.user?.id;
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const user = await db.select().from(userTable).where(eq(userTable.id, userId)).execute();
    if (!user || user.length === 0) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const passwordMatch = await Bun.password.verify(currentPassword, user[0].password);
    if (!passwordMatch) {
        return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const passwordHash = await Bun.password.hash(newPassword, {
        algorithm: 'argon2id',
        memoryCost: 4,
        timeCost: 3,
    });

    await db.update(userTable).set({ password: passwordHash }).where(eq(userTable.id, userId));

    return context.redirect('/profile');
}
