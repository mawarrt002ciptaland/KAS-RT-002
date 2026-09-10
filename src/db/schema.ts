import { sql } from "drizzle-orm";
import { boolean, date, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const residentStatus = pgEnum("resident_status", ["aktif", "nonaktif"]);
export const transactionType = pgEnum("transaction_type", ["masuk", "keluar"]);
export const billStatus = pgEnum("bill_status", ["lunas", "belum_lunas"]);

export const residents = pgTable("residents", {
  id: serial("id").primaryKey(), nik: text("nik").notNull().unique(), name: text("name").notNull(),
  address: text("address").notNull(), phone: text("phone").notNull(), familyMembers: integer("family_members").notNull().default(1),
  status: residentStatus("status").notNull().default("aktif"), joinedAt: date("joined_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const feeTypes = pgTable("fee_types", {
  id: serial("id").primaryKey(), name: text("name").notNull(), amount: integer("amount").notNull(),
  description: text("description").notNull().default(""), active: boolean("active").notNull().default(true),
});
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(), type: transactionType("type").notNull(), category: text("category").notNull(),
  description: text("description").notNull(), amount: integer("amount").notNull(), transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(), residentId: integer("resident_id").notNull().references(() => residents.id, { onDelete: "cascade" }),
  feeTypeId: integer("fee_type_id").notNull().references(() => feeTypes.id, { onDelete: "restrict" }), period: text("period").notNull(),
  amount: integer("amount").notNull(), status: billStatus("status").notNull().default("belum_lunas"), dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"), createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authUsers = pgTable("kasrt_auth_users", {
  id: serial("id").primaryKey(), username: text("username").notNull().unique(), passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(), role: text("role").$type<"admin" | "warga">().notNull().default("warga"),
  residentId: integer("resident_id").unique().references(() => residents.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true), bootstrap: boolean("bootstrap").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("kasrt_single_bootstrap_admin").on(table.bootstrap).where(sql`${table.bootstrap} = true`)]);

export const authSessions = pgTable("kasrt_auth_sessions", {
  tokenHash: text("token_hash").primaryKey(), userId: integer("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("kasrt_session_user_idx").on(table.userId), index("kasrt_session_expiry_idx").on(table.expiresAt)]);

export const signupChecks = pgTable("kasrt_signup_checks", {
  tokenHash: text("token_hash").primaryKey(), residentId: integer("resident_id").notNull().references(() => residents.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const authLimits = pgTable("kasrt_auth_limits", {
  key: text("key").primaryKey(), attempts: integer("attempts").notNull().default(1), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const paymentProofs = pgTable("kasrt_payment_proofs", {
  id: serial("id").primaryKey(), billId: integer("bill_id").notNull().unique().references(() => bills.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => authUsers.id, { onDelete: "restrict" }),
  image: text("image").notNull(), status: text("status").$type<"pending" | "approved">().notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
