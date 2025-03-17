

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "author" "text" NOT NULL,
    "isbn" "text" NOT NULL,
    "category" "text" NOT NULL,
    "publication_year" integer NOT NULL,
    "publisher" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "status" "text" NOT NULL,
    "cover_image" "text",
    "stock" integer DEFAULT 0 NOT NULL,
    "location" "text",
    "rating" numeric(3,1),
    "page_count" integer,
    "language" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "sales_count" integer DEFAULT 0 NOT NULL,
    "reminder_sent" boolean DEFAULT false,
    "reminder_date" timestamp without time zone
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."borrowings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid",
    "member_id" "uuid",
    "checkout_date" timestamp with time zone DEFAULT "now"(),
    "due_date" timestamp with time zone NOT NULL,
    "return_date" timestamp with time zone,
    "status" "text" DEFAULT 'Borrowed'::"text" NOT NULL,
    "notes" "text",
    "condition_on_return" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "reminder_sent" boolean DEFAULT false,
    "reminder_date" timestamp with time zone
);


ALTER TABLE "public"."borrowings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid",
    "book_id" "uuid",
    "title" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkout_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "customer_id" "text",
    "status" "text" NOT NULL,
    "payment_method" "text",
    "return_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."checkout_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "joined_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."members" OWNER TO "postgres";


ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_isbn_key" UNIQUE ("isbn");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."borrowings"
    ADD CONSTRAINT "borrowings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_items"
    ADD CONSTRAINT "checkout_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_transactions"
    ADD CONSTRAINT "checkout_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



CREATE INDEX "books_user_id_idx" ON "public"."books" USING "btree" ("user_id");



CREATE INDEX "borrowings_book_id_idx" ON "public"."borrowings" USING "btree" ("book_id");



CREATE INDEX "borrowings_member_id_idx" ON "public"."borrowings" USING "btree" ("member_id");



CREATE INDEX "borrowings_status_idx" ON "public"."borrowings" USING "btree" ("status");



CREATE INDEX "borrowings_user_id_idx" ON "public"."borrowings" USING "btree" ("user_id");



CREATE INDEX "checkout_transactions_user_id_idx" ON "public"."checkout_transactions" USING "btree" ("user_id");



CREATE INDEX "members_user_id_idx" ON "public"."members" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_books_modtime" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."borrowings"
    ADD CONSTRAINT "borrowings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."borrowings"
    ADD CONSTRAINT "borrowings_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."borrowings"
    ADD CONSTRAINT "borrowings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."checkout_items"
    ADD CONSTRAINT "checkout_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkout_items"
    ADD CONSTRAINT "checkout_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."checkout_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkout_transactions"
    ADD CONSTRAINT "checkout_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Books can be updated by anyone" ON "public"."books" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Checkout items can be inserted by anyone" ON "public"."checkout_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Checkout transactions can be inserted by anyone" ON "public"."checkout_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."books" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."borrowings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."members" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."books" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."borrowings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."members" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable update for users based on email" ON "public"."borrowings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for users based on user_id" ON "public"."members" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."borrowings" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."members" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Public books are viewable by everyone" ON "public"."books" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public checkout items are viewable by everyone" ON "public"."checkout_items" FOR SELECT USING (true);



CREATE POLICY "Public checkout transactions are viewable by everyone" ON "public"."checkout_transactions" FOR SELECT USING (true);



ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."borrowings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkout_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkout_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."borrowings" TO "anon";
GRANT ALL ON TABLE "public"."borrowings" TO "authenticated";
GRANT ALL ON TABLE "public"."borrowings" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_items" TO "anon";
GRANT ALL ON TABLE "public"."checkout_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_items" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_transactions" TO "anon";
GRANT ALL ON TABLE "public"."checkout_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
