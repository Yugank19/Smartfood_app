import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zubirjxjmjvmpyezmyzg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_60vYmXr2OifIdrQs5vc6qA_6hV00AGo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
