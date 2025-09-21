# Database Setup for Favorites Functionality

The favorites functionality requires a `user_favorites` table in your Supabase database.

## Quick Setup

1. **Go to your Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Navigate to your AgendaVE project
   - Go to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/add_user_favorites_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify the Table**
   - Go to Database → Tables
   - You should see a new `user_favorites` table

## What the Migration Does

- ✅ Creates `user_favorites` table with proper structure
- ✅ Sets up foreign key relationships to `auth.users` and `providers`
- ✅ Adds unique constraint to prevent duplicate favorites
- ✅ Creates database indexes for performance
- ✅ Enables Row Level Security (RLS) for data protection
- ✅ Sets up proper permissions for authenticated users
- ✅ Creates policies so users can only manage their own favorites

## Table Structure

```sql
user_favorites (
    id UUID (Primary Key)
    user_id UUID (Foreign Key to auth.users)
    provider_id UUID (Foreign Key to providers)
    created_at TIMESTAMP
    updated_at TIMESTAMP
    UNIQUE(user_id, provider_id)
)
```

## Testing

After running the migration, the favorites functionality should work:

- ❤️ Users can add/remove favorites from provider cards
- ❤️ Users can view their favorites in the dedicated tab
- ❤️ Hearts show filled/empty state correctly
- ❤️ Data is properly secured with RLS policies

## Troubleshooting

### "Table not found" (404) errors:
1. Make sure you ran the SQL script in your Supabase project
2. Check that the table appears in Database → Tables
3. Verify the table was created successfully

### "Not Acceptable" (406) errors:
This usually means RLS policies are blocking access. Try these solutions:

**Option 1: Fix RLS Policies (Recommended)**
1. Run the script: `migrations/fix_user_favorites_policies.sql`
2. This will recreate the RLS policies with correct syntax

**Option 2: Temporary Testing (Quick Fix)**
1. Run the script: `migrations/disable_rls_for_testing.sql`
2. This temporarily disables RLS for testing
3. ⚠️ **Warning**: This makes data accessible to all users
4. Remember to re-enable RLS with proper policies later

**Option 3: Manual Policy Check**
1. Go to Database → Policies in Supabase
2. Check if policies exist for `user_favorites` table
3. Delete any problematic policies
4. Re-run the original migration script

### Still not working?
1. Check your browser's developer console for specific errors
2. Verify you're logged in as the correct user
3. Try logging out and back in
4. Check Supabase logs in your dashboard

The favorites tab with heart icon (❤️) should now work perfectly!
