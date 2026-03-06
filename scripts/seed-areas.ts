/**
 * Seed areas from pixxicrm_areas_complete.json into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-areas.ts
 *
 * Prerequisites:
 *   1. Run add-area-columns.sql in Supabase SQL Editor first
 *   2. npm install @supabase/supabase-js (already installed)
 */
import { createClient } from '@supabase/supabase-js';
import areasData from '../../pixxicrm_areas_complete.json';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dancvhyipsbmdndzxniu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbmN2aHlpcHNibWRuZHp4bml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzM3NDksImV4cCI6MjA4Nzc0OTc0OX0.Bd9AU7x9kqvCg1lDcoOGqba-rdxjVKmNGHmdptk4jxI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedAreas() {
  const areas = (areasData as any).areas;
  console.log(`Seeding ${areas.length} areas...`);

  // First, get existing areas to match by name
  const { data: existing } = await supabase.from('areas').select('id, name');
  const existingMap = new Map((existing || []).map((a: any) => [a.name, a.id]));

  let updated = 0;
  let inserted = 0;
  let errors = 0;

  // Process in batches of 50
  for (let i = 0; i < areas.length; i += 50) {
    const batch = areas.slice(i, i + 50);

    for (const area of batch) {
      const row = {
        name: area.name,
        city: area.city,
        new_count: area.new_projects || 0,
        sell_count: area.sell_listings || 0,
        rent_count: area.rent_listings || 0,
        image_url: area.image_url || null,
        latitude: area.latitude || null,
        longitude: area.longitude || null,
        country: area.country || 'United Arab Emirates',
        description: area.description || null,
      };

      const existingId = existingMap.get(area.name);

      if (existingId) {
        // Update existing
        const { error } = await supabase
          .from('areas')
          .update(row)
          .eq('id', existingId);
        if (error) {
          console.error(`Error updating ${area.name}:`, error.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('areas')
          .insert(row);
        if (error) {
          console.error(`Error inserting ${area.name}:`, error.message);
          errors++;
        } else {
          inserted++;
        }
      }
    }

    console.log(`Processed ${Math.min(i + 50, areas.length)} / ${areas.length}`);
  }

  console.log(`\nDone! Updated: ${updated}, Inserted: ${inserted}, Errors: ${errors}`);
}

seedAreas().catch(console.error);
