# Templates Supabase Migration

## Problem Solved
Templates were previously stored only in browser-local storage (localStorage/IndexedDB), which meant they weren't accessible when logging in from different browsers. Templates are now stored in Supabase cloud storage, making them accessible from any browser or device.

## Changes Made

### Updated `src/utils/templates.ts`
All template functions now use Supabase as the primary storage mechanism:

1. **Question Templates** (`getQuestionTemplates`, `saveQuestionTemplate`, `deleteQuestionTemplate`, `updateQuestionTemplate`)
   - Uses `question_templates` table in Supabase
   - Falls back to IndexedDB/localStorage if Supabase is unavailable

2. **Prototype Templates** (`getPrototypeTemplates`, `savePrototypeTemplate`, `deletePrototypeTemplate`, `updatePrototypeTemplate`)
   - Uses `prototype_templates` table in Supabase
   - Falls back to IndexedDB/localStorage if Supabase is unavailable

3. **Application Step Templates** (`getApplicationStepTemplates`, `saveApplicationStepTemplate`, `deleteApplicationStepTemplate`, `updateApplicationStepTemplate`)
   - Uses `application_step_templates` table in Supabase
   - Falls back to IndexedDB/localStorage if Supabase is unavailable
   - Works exactly like question templates with its own dedicated table

## Database Schema

### Existing Tables (Already Created)
- `question_templates` - Stores question templates
- `prototype_templates` - Stores prototype templates

### Required: Create Application Step Templates Table

**Important:** You need to create the `application_step_templates` table for application step templates to work. Run this SQL in your Supabase SQL Editor:

```sql
-- Create application_step_templates table
CREATE TABLE IF NOT EXISTS application_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  step_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE application_step_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public access)
-- Adjust these policies based on your security requirements
CREATE POLICY "Allow public SELECT on application_step_templates"
  ON application_step_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public INSERT on application_step_templates"
  ON application_step_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on application_step_templates"
  ON application_step_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public DELETE on application_step_templates"
  ON application_step_templates FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_application_step_templates_created_at 
  ON application_step_templates(created_at DESC);
```

**Note:** This table is required for application step templates to work properly. The code expects this table to exist, similar to how `question_templates` and `prototype_templates` tables exist.

## How It Works

### Storage Priority
1. **Primary**: Supabase cloud storage (shared across all browsers/devices)
2. **Fallback**: IndexedDB (browser-local, larger capacity)
3. **Final Fallback**: localStorage (browser-local, limited capacity)

### Data Flow
- When saving: Templates are saved to Supabase first. If Supabase is unavailable, they're saved locally.
- When loading: Templates are loaded from Supabase first. If Supabase is unavailable, they're loaded from local storage.
- This ensures templates are always accessible, even offline, but sync across browsers when online.

## Testing

1. **Test Cross-Browser Sync:**
   - Save a template in Browser A
   - Log in from Browser B
   - The template should appear in Browser B

2. **Test Offline Fallback:**
   - Disable network connection
   - Templates should still load from local storage
   - New templates will be saved locally and sync when connection is restored

3. **Test Supabase Connection:**
   - Check browser console for any Supabase errors
   - Verify templates appear in Supabase dashboard under respective tables

## Troubleshooting

### Templates Not Syncing Across Browsers?
- Verify Supabase environment variables are set (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Check browser console for Supabase connection errors
- Verify RLS policies allow public access (if using public access)
- Check Supabase dashboard to see if templates are being saved

### Still Using Local Storage?
- Ensure `.env` file exists with Supabase credentials
- Restart dev server after adding environment variables
- Check that `USE_SUPABASE` is `true` (check browser console)

### Application Step Templates Not Working?
- Make sure the `application_step_templates` table exists in Supabase
- Run the SQL script above in Supabase SQL Editor to create the table
- Check browser console for any table-related errors

## Benefits

✅ **Cross-Browser Access**: Templates accessible from any browser or device  
✅ **Shared Storage**: All users see the same templates  
✅ **Offline Support**: Falls back to local storage when offline  
✅ **Backward Compatible**: Existing local templates still work  
✅ **Automatic Sync**: Changes sync automatically across all browsers  

