DO $$ BEGIN
CREATE TYPE "public"."bill_status" AS ENUM('lunas', 'belum_lunas');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TYPE "public"."resident_status" AS ENUM('aktif', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TYPE "public"."transaction_type" AS ENUM('masuk', 'keluar');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kasrt_auth_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kasrt_auth_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kasrt_auth_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'warga' NOT NULL,
	"resident_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"bootstrap" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kasrt_auth_users_username_unique" UNIQUE("username"),
	CONSTRAINT "kasrt_auth_users_resident_id_unique" UNIQUE("resident_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"resident_id" integer NOT NULL,
	"fee_type_id" integer NOT NULL,
	"period" text NOT NULL,
	"amount" integer NOT NULL,
	"status" "bill_status" DEFAULT 'belum_lunas' NOT NULL,
	"due_date" date NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kasrt_payment_proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"image" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kasrt_payment_proofs_bill_id_unique" UNIQUE("bill_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "residents" (
	"id" serial PRIMARY KEY NOT NULL,
	"nik" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"family_members" integer DEFAULT 1 NOT NULL,
	"status" "resident_status" DEFAULT 'aktif' NOT NULL,
	"joined_at" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "residents_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kasrt_signup_checks" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"resident_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "transaction_type" NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "kasrt_auth_sessions" ADD CONSTRAINT "kasrt_auth_sessions_user_id_kasrt_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."kasrt_auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "kasrt_auth_users" ADD CONSTRAINT "kasrt_auth_users_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "bills" ADD CONSTRAINT "bills_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "bills" ADD CONSTRAINT "bills_fee_type_id_fee_types_id_fk" FOREIGN KEY ("fee_type_id") REFERENCES "public"."fee_types"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "kasrt_payment_proofs" ADD CONSTRAINT "kasrt_payment_proofs_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "kasrt_payment_proofs" ADD CONSTRAINT "kasrt_payment_proofs_user_id_kasrt_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."kasrt_auth_users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "kasrt_signup_checks" ADD CONSTRAINT "kasrt_signup_checks_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kasrt_session_user_idx" ON "kasrt_auth_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kasrt_session_expiry_idx" ON "kasrt_auth_sessions" USING btree ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kasrt_single_bootstrap_admin" ON "kasrt_auth_users" USING btree ("bootstrap") WHERE "kasrt_auth_users"."bootstrap" = true;
