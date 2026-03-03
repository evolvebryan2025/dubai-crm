-- ============================================================
-- FIX: listing_images RLS policies
-- The original policies only checked that a listing existed,
-- not that the current user has access to that listing.
-- This fix ensures agents can only see/modify images for
-- listings they are assigned to, while admins see all.
-- ============================================================

-- Drop the existing permissive policies
DROP POLICY IF EXISTS listing_images_select ON public.listing_images;
DROP POLICY IF EXISTS listing_images_insert ON public.listing_images;
DROP POLICY IF EXISTS listing_images_update ON public.listing_images;

-- SELECT: admin+ sees all images; agents see only images for their assigned listings
CREATE POLICY listing_images_select ON public.listing_images
  FOR SELECT USING (
    public.is_admin_or_above()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.assigned_agent_id = auth.uid()
    )
  );

-- INSERT: admin+ can add to any listing; agents only to their assigned listings
CREATE POLICY listing_images_insert ON public.listing_images
  FOR INSERT WITH CHECK (
    public.is_admin_or_above()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.assigned_agent_id = auth.uid()
    )
  );

-- UPDATE: admin+ can update any image; agents only for their assigned listings
CREATE POLICY listing_images_update ON public.listing_images
  FOR UPDATE USING (
    public.is_admin_or_above()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.assigned_agent_id = auth.uid()
    )
  );

-- DELETE policy remains unchanged (admin+ only)
