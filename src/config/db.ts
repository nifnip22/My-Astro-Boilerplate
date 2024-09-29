import mysql from 'mysql2/promise';
import { mysqlTable, varchar, datetime } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';

const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'db_astro_boilerplate' });
export const db = drizzle(connection);

export const userTable = mysqlTable('users', {
	id: varchar('id', {
		length: 255,
	}).primaryKey(),
	username: varchar('username', {
		length: 255,
	}).notNull(),
	email: varchar('email', {
		length: 255,
	}).unique().notNull(),
	password: varchar('password', {
		length: 255,
	}).notNull(),
	createdAt: datetime('created_at').notNull(),
	updatedAt: datetime('updated_at'),
});

export const sessionTable = mysqlTable('session', {
	id: varchar('id', {
		length: 255,
	}).primaryKey(),
	userId: varchar('user_id', {
		length: 255,
	})
		.notNull()
		.references(() => userTable.id),
	expiresAt: datetime('expires_at').notNull(),
});
