import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_review_status" AS ENUM('draft', 'review', 'approved', 'published');
  CREATE TYPE "public"."enum_pages_template" AS ENUM('standard', 'product', 'docs', 'internal');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('draft', 'review', 'approved', 'published');
  CREATE TYPE "public"."enum__pages_v_version_template" AS ENUM('standard', 'product', 'docs', 'internal');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_review_status" AS ENUM('draft', 'review', 'published');
  CREATE TYPE "public"."enum_articles_category" AS ENUM('product-content', 'internal-guide', 'release-note', 'knowledge-base');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_review_status" AS ENUM('draft', 'review', 'published');
  CREATE TYPE "public"."enum__articles_v_version_category" AS ENUM('product-content', 'internal-guide', 'release-note', 'knowledge-base');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_editorial_workflows_stages_state" AS ENUM('todo', 'in-progress', 'done');
  CREATE TYPE "public"."enum_editorial_workflows_status" AS ENUM('planned', 'active', 'paused', 'archived');
  CREATE TYPE "public"."enum_review_tasks_status" AS ENUM('new', 'in-progress', 'blocked', 'ready', 'done');
  CREATE TYPE "public"."enum_review_tasks_priority" AS ENUM('low', 'normal', 'high');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'reviewer');
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"review_status" "enum_pages_review_status" DEFAULT 'draft',
  	"template" "enum_pages_template" DEFAULT 'standard',
  	"hero_eyebrow" varchar,
  	"hero_headline" varchar,
  	"hero_summary" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"owner" varchar,
  	"review_notes" varchar,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_review_status" "enum__pages_v_version_review_status" DEFAULT 'draft',
  	"version_template" "enum__pages_v_version_template" DEFAULT 'standard',
  	"version_hero_eyebrow" varchar,
  	"version_hero_headline" varchar,
  	"version_hero_summary" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_owner" varchar,
  	"version_review_notes" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "articles_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"review_status" "enum_articles_review_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"summary" varchar,
  	"cover_image_id" integer,
  	"content" jsonb,
  	"category" "enum_articles_category",
  	"owner" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_articles_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_review_status" "enum__articles_v_version_review_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_summary" varchar,
  	"version_cover_image_id" integer,
  	"version_content" jsonb,
  	"version_category" "enum__articles_v_version_category",
  	"version_owner" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "editorial_workflows_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"state" "enum_editorial_workflows_stages_state" DEFAULT 'todo' NOT NULL,
  	"notes" varchar
  );
  
  CREATE TABLE "editorial_workflows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_editorial_workflows_status" DEFAULT 'active' NOT NULL,
  	"owner" varchar,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "review_tasks_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"is_done" boolean DEFAULT false
  );
  
  CREATE TABLE "review_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_review_tasks_status" DEFAULT 'new' NOT NULL,
  	"priority" "enum_review_tasks_priority" DEFAULT 'normal' NOT NULL,
  	"assignee" varchar,
  	"due_at" timestamp(3) with time zone,
  	"workflow_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "review_tasks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"articles_id" integer
  );
  
  CREATE TABLE "media_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN "name" varchar;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor';
  ALTER TABLE "users" ADD COLUMN "department" varchar;
  ALTER TABLE "media" ADD COLUMN "caption" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "articles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "editorial_workflows_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "review_tasks_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_tags" ADD CONSTRAINT "articles_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_version_tags" ADD CONSTRAINT "_articles_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "editorial_workflows_stages" ADD CONSTRAINT "editorial_workflows_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."editorial_workflows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "review_tasks_checklist" ADD CONSTRAINT "review_tasks_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."review_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_workflow_id_editorial_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."editorial_workflows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "review_tasks_rels" ADD CONSTRAINT "review_tasks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."review_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "review_tasks_rels" ADD CONSTRAINT "review_tasks_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "review_tasks_rels" ADD CONSTRAINT "review_tasks_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_hero_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_hero_version_hero_image_idx" ON "_pages_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "articles_tags_order_idx" ON "articles_tags" USING btree ("_order");
  CREATE INDEX "articles_tags_parent_id_idx" ON "articles_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_image_idx" ON "articles" USING btree ("cover_image_id");
  CREATE INDEX "articles_seo_seo_image_idx" ON "articles" USING btree ("seo_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "_articles_v_version_tags_order_idx" ON "_articles_v_version_tags" USING btree ("_order");
  CREATE INDEX "_articles_v_version_tags_parent_id_idx" ON "_articles_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_image_idx" ON "_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_articles_v_version_seo_version_seo_image_idx" ON "_articles_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX "editorial_workflows_stages_order_idx" ON "editorial_workflows_stages" USING btree ("_order");
  CREATE INDEX "editorial_workflows_stages_parent_id_idx" ON "editorial_workflows_stages" USING btree ("_parent_id");
  CREATE INDEX "editorial_workflows_updated_at_idx" ON "editorial_workflows" USING btree ("updated_at");
  CREATE INDEX "editorial_workflows_created_at_idx" ON "editorial_workflows" USING btree ("created_at");
  CREATE INDEX "review_tasks_checklist_order_idx" ON "review_tasks_checklist" USING btree ("_order");
  CREATE INDEX "review_tasks_checklist_parent_id_idx" ON "review_tasks_checklist" USING btree ("_parent_id");
  CREATE INDEX "review_tasks_workflow_idx" ON "review_tasks" USING btree ("workflow_id");
  CREATE INDEX "review_tasks_updated_at_idx" ON "review_tasks" USING btree ("updated_at");
  CREATE INDEX "review_tasks_created_at_idx" ON "review_tasks" USING btree ("created_at");
  CREATE INDEX "review_tasks_rels_order_idx" ON "review_tasks_rels" USING btree ("order");
  CREATE INDEX "review_tasks_rels_parent_idx" ON "review_tasks_rels" USING btree ("parent_id");
  CREATE INDEX "review_tasks_rels_path_idx" ON "review_tasks_rels" USING btree ("path");
  CREATE INDEX "review_tasks_rels_pages_id_idx" ON "review_tasks_rels" USING btree ("pages_id");
  CREATE INDEX "review_tasks_rels_articles_id_idx" ON "review_tasks_rels" USING btree ("articles_id");
  CREATE INDEX "media_tags_order_idx" ON "media_tags" USING btree ("_order");
  CREATE INDEX "media_tags_parent_id_idx" ON "media_tags" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_editorial_workflows_fk" FOREIGN KEY ("editorial_workflows_id") REFERENCES "public"."editorial_workflows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_review_tasks_fk" FOREIGN KEY ("review_tasks_id") REFERENCES "public"."review_tasks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_editorial_workflows_id_idx" ON "payload_locked_documents_rels" USING btree ("editorial_workflows_id");
  CREATE INDEX "payload_locked_documents_rels_review_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("review_tasks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "editorial_workflows_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "editorial_workflows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "review_tasks_checklist" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "review_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "review_tasks_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "articles_tags" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "_articles_v_version_tags" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "editorial_workflows_stages" CASCADE;
  DROP TABLE "editorial_workflows" CASCADE;
  DROP TABLE "review_tasks_checklist" CASCADE;
  DROP TABLE "review_tasks" CASCADE;
  DROP TABLE "review_tasks_rels" CASCADE;
  DROP TABLE "media_tags" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_articles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_editorial_workflows_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_review_tasks_fk";
  
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_articles_id_idx";
  DROP INDEX "payload_locked_documents_rels_editorial_workflows_id_idx";
  DROP INDEX "payload_locked_documents_rels_review_tasks_id_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "media" DROP COLUMN "caption";
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "department";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "articles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "editorial_workflows_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "review_tasks_id";
  DROP TYPE "public"."enum_pages_review_status";
  DROP TYPE "public"."enum_pages_template";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_review_status";
  DROP TYPE "public"."enum__pages_v_version_template";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_articles_review_status";
  DROP TYPE "public"."enum_articles_category";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_review_status";
  DROP TYPE "public"."enum__articles_v_version_category";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_editorial_workflows_stages_state";
  DROP TYPE "public"."enum_editorial_workflows_status";
  DROP TYPE "public"."enum_review_tasks_status";
  DROP TYPE "public"."enum_review_tasks_priority";
  DROP TYPE "public"."enum_users_role";`)
}
