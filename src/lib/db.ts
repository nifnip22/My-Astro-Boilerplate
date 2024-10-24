import mysql from 'mysql2/promise';
import { mysqlTable, varchar, datetime, boolean } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';

const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'db_astro_boilerplate' });
export const db = drizzle(connection);

export const userTable = mysqlTable('users', {
	id: varchar('id', {
		length: 255,
	}).notNull().primaryKey(),
	username: varchar('username', {
		length: 255,
	}).notNull(),
	email: varchar('email', {
		length: 255,
	})
		.unique()
		.notNull(),
	emailVerified: boolean('email_verified'),
	password: varchar('password', {
		length: 255,
	}).notNull(),
	createdAt: datetime('created_at').notNull(),
	updatedAt: datetime('updated_at'),
});

export const sessionTable = mysqlTable('session', {
	id: varchar('id', {
		length: 255,
	}).notNull().primaryKey(),
	userId: varchar('user_id', {
		length: 255,
	})
		.notNull()
		.references(() => userTable.id)
		.unique(),
	expiresAt: datetime('expires_at').notNull(),
});

export const emailVerificationCodeTable = mysqlTable('email_verification_code', {
	id: varchar('id', {
		length: 255,
	}).notNull().primaryKey(),
	code: varchar('code', {
		length: 255,
	}).notNull(),
	userId: varchar('user_id', {
		length: 255,
	})
		.notNull()
		.references(() => userTable.id)
		.unique(),
	email: varchar('email', {
		length: 255,
	}).notNull(),
	expiresAt: datetime('expires_at').notNull(),
});

export const passwordResetTokensTable = mysqlTable('password_reset_tokens', {
	id: varchar('id', {
		length: 255,
	}).notNull().primaryKey(),
	tokenHash: varchar('token_hash', {
		length: 255,
	}).notNull().unique(),
	userId: varchar('user_id', {
		length: 255,
	})
		.notNull()
		.references(() => userTable.id)
		.unique(),
	expiresAt: datetime('expires_at').notNull(),
})