import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vztlkrnqwyvkdxviusmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGxrcm5xd3l2a2R4dml1c21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgyNjgsImV4cCI6MjA4NjQwNDI2OH0.wUeY1R8nhv6jMRsEJj9LImH5V8VyvLhE_K7U5N3i6Dc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
