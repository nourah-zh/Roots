import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lkxrmglrudwxuvhiceni.supabase.co'
const supabaseKey = 'sb_publishable_NN2TlGSz1OOTCcC-0UXLrg_pzsJGS7O'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)