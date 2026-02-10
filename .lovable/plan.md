
# Fix Build Error, Profile Save, and Logo

## Issue 1: Build Error - Missing `lovable-tagger` package
The `vite.config.ts` imports `lovable-tagger` which is not installed, breaking the entire build. This must be fixed first.

**Fix:** Remove the `lovable-tagger` import and `componentTagger()` plugin call from `vite.config.ts`. Keep the rest of the config intact.

## Issue 2: Profile Save Failing
The Settings page tries to save `social_links` to the `profiles` table, but that column does not exist in the database. The error toast "Failed to save profile" confirms this.

**Fix (two parts):**
1. **Database migration** - Add the missing column:
   ```sql
   ALTER TABLE public.profiles
   ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT NULL;
   ```
2. **Code update** - Update `useUserProfile.ts` to properly read and cast the `social_links` column from the database when fetching profile data, instead of always setting it to `null`.

## Issue 3: Logo Change
The user wants to replace the current Lovable-style logo with their own "Share The Link" branding. The current `src/assets/logo.svg` shows a chain-link icon. No change is needed to the Logo component itself -- the SVG file just needs to be a proper "Share The Link" branded logo (chain link design with gradient colors matching the app's purple-to-pink theme). The current SVG already represents this, so the logo component is correct. If the user has a specific logo file to upload, that can be swapped in.

## Technical Summary

| Step | File | Change |
|------|------|--------|
| 1 | `vite.config.ts` | Remove `lovable-tagger` import and plugin usage |
| 2 | Database migration | Add `social_links JSONB` column to `profiles` |
| 3 | `src/hooks/useUserProfile.ts` | Read `social_links` from DB instead of hardcoding `null` |
