import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djvplvbfffwfbhoteizi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdnBsdmJmZmZ3ZmJob3RlaXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAyNjEsImV4cCI6MjA4NzI2NjI2MX0.Ts2NN5d_imXF7GZVw75_T0I8bAwXng5l5icyoGfXfBA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
