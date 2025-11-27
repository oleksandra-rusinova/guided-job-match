# Connecting Supabase to Netlify

This guide will help you connect your Supabase database to your Netlify deployment.

## Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 2: Set Up Environment Variables Locally

1. Create a `.env` file in the root of your project:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual values from Step 1.

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed to your repository.

## Step 3: Configure Netlify Environment Variables

### Option A: Via Netlify Dashboard (Recommended)

1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Click **Add a variable** and add:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL
5. Click **Add a variable** again and add:
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon/public key
6. Click **Save**

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your_supabase_project_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_supabase_anon_key"
```

## Step 4: Deploy to Netlify

### Option A: Via Netlify Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify Dashboard, go to **Site settings** → **Build & deploy**
3. Connect your repository if not already connected
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

### Option B: Via Netlify CLI

```bash
# Build your project
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Step 5: Use Supabase in Your Code

Import and use the Supabase client in your components:

```typescript
import { supabase } from './utils/supabase';

// Example: Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');

// Example: Insert data
const { data, error } = await supabase
  .from('your_table')
  .insert([{ column: 'value' }]);

// Example: Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

## Important Notes

- **VITE_ prefix:** Environment variables in Vite must be prefixed with `VITE_` to be exposed to the client-side code
- **Security:** The `anon` key is safe to expose in client-side code. Never expose your `service_role` key
- **CORS:** Make sure your Supabase project allows requests from your Netlify domain. Check **Settings** → **API** → **Allowed origins** in Supabase
- **Rebuild:** After adding environment variables in Netlify, trigger a new deployment for the changes to take effect

## Troubleshooting

### Environment variables not working in Netlify
- Make sure variables are prefixed with `VITE_`
- Trigger a new deployment after adding variables
- Check that variable names match exactly (case-sensitive)

### CORS errors
- Add your Netlify domain to Supabase allowed origins
- Format: `https://your-site.netlify.app` (include `https://`)

### Build fails
- Check Netlify build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify build command is correct: `npm run build`

