-- ============================================================
-- Dubai Real Estate CRM — DELETE ALL CONTENT
-- ============================================================
--
-- ⚠️  DESTRUCTIVE AND IRREVERSIBLE.
--     This wipes every CRM record. Take a database backup first
--     (Supabase Dashboard → Database → Backups, or `pg_dump`).
--
-- WHAT THIS DOES (SECTION 1 — runs by default):
--   Deletes ALL business/content rows from the CRM:
--     owners, listings, listing_images, leads, upload_batches,
--     contacts, transactions, commission_approvals, activity_logs
--   Keeps: table structure, triggers, functions, and the
--   user/account layer (auth.users, profiles, teams, settings).
--
-- WHAT IT DOES NOT DO (SECTION 2 — commented out):
--   Wiping users, teams, and settings — a full factory reset.
--   Uncomment Section 2 ONLY if you also want to remove all
--   user accounts, teams, and app configuration.
--
-- NOTE: This script only removes database rows. Files already
--   uploaded to Supabase Storage (the listing-images bucket)
--   are NOT deleted by SQL — see the bottom of this file.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste → Run
--   or: psql "$DATABASE_URL" -f supabase/scripts/delete_all_crm_data.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- SECTION 1 — Wipe all CRM content (data only)
-- ------------------------------------------------------------
-- TRUNCATE ... CASCADE handles all foreign-key dependencies in
-- one shot, so explicit ordering is unnecessary. CASCADE here
-- only reaches the data tables listed below (and their FK
-- children); it does NOT touch profiles/teams/settings/auth.

TRUNCATE TABLE
  public.commission_approvals,
  public.transactions,
  public.listing_images,
  public.listings,
  public.leads,
  public.contacts,
  public.upload_batches,
  public.owners,
  public.activity_logs
RESTART IDENTITY CASCADE;

-- Reset human-readable reference-number sequences so new
-- listings/transactions start again from 00001.
ALTER SEQUENCE public.listing_ref_seq RESTART WITH 1;
ALTER SEQUENCE public.transaction_ref_seq RESTART WITH 1;

-- ------------------------------------------------------------
-- SECTION 2 — OPTIONAL full reset (users, teams, settings)
-- ------------------------------------------------------------
-- ⚠️  Uncomment ONLY for a complete factory reset. This removes
--     every user account, team, and configuration value, and
--     will log you out / require re-provisioning admin users.
--
-- -- App configuration
-- TRUNCATE TABLE public.settings RESTART IDENTITY CASCADE;
--
-- -- Profiles cascade-delete from auth.users, so delete the auth
-- -- users (profiles.id REFERENCES auth.users ON DELETE CASCADE).
-- DELETE FROM auth.users;
--
-- -- Teams reference profiles; with users gone they can be cleared.
-- TRUNCATE TABLE public.teams RESTART IDENTITY CASCADE;

COMMIT;

-- ============================================================
-- SUPABASE STORAGE (not handled by SQL above)
-- ============================================================
-- Listing images live in a Storage bucket, not in this database
-- (listing_images.storage_path points at it). To also delete
-- those files, empty the bucket via the Dashboard
-- (Storage → <your image bucket> → select all → delete) or run,
-- substituting your actual bucket id:
--
--   -- Requires the storage schema; deletes object records:
--   -- DELETE FROM storage.objects WHERE bucket_id = 'listing-images';
--
-- ============================================================
