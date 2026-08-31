CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"message" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"payment_method" text,
	"transaction_id" text,
	"proof_file_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_reference_id_unique" UNIQUE("reference_id")
);
