// 🚀 Script to apply rating trigger to the database
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRatingTrigger() {
  try {
    console.log('🔄 Applying rating trigger migration...')
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'database', 'migrations', 'add_rating_trigger.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Error applying migration:', error)
      return
    }
    
    console.log('✅ Rating trigger applied successfully!')
    console.log('📊 Provider ratings will now update automatically when reviews change')
    
    // Test the trigger by manually updating all provider ratings
    console.log('🔄 Recalculating all provider ratings...')
    
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id')
    
    if (providersError) {
      console.error('Error fetching providers:', providersError)
      return
    }
    
    // Trigger rating updates for all providers
    for (const provider of providers) {
      const { error: updateError } = await supabase
        .from('reviews')
        .select('id')
        .eq('provider_id', provider.id)
        .limit(1)
        .then(async ({ data: reviews }) => {
          if (reviews && reviews.length > 0) {
            // Trigger the rating update by touching a review
            await supabase
              .from('reviews')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', reviews[0].id)
          }
        })
    }
    
    console.log('✅ All provider ratings recalculated!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Alternative: Direct SQL execution function
async function applyRatingTriggerDirect() {
  try {
    console.log('🔄 Creating rating update function...')
    
    const createFunction = `
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_provider_id UUID;
    avg_rating NUMERIC;
    review_count INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_provider_id = OLD.provider_id;
    ELSE
        target_provider_id = NEW.provider_id;
    END IF;
    
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE provider_id = target_provider_id;
    
    UPDATE providers 
    SET 
        rating = ROUND(avg_rating, 2),
        total_reviews = review_count,
        updated_at = NOW()
    WHERE id = target_provider_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
    `
    
    const { error: funcError } = await supabase.rpc('exec_sql', { sql_query: createFunction })
    if (funcError) {
      console.error('❌ Error creating function:', funcError)
      return
    }
    
    console.log('🔄 Creating trigger...')
    
    const createTrigger = `
DROP TRIGGER IF EXISTS reviews_update_provider_rating ON public.reviews;
CREATE TRIGGER reviews_update_provider_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_rating();
    `
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql_query: createTrigger })
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError)
      return
    }
    
    console.log('✅ Rating trigger created successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
console.log('🚀 Starting rating trigger migration...')
applyRatingTriggerDirect()