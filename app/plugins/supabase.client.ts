import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
  name: 'supabase',
  setup() {
    const config = useRuntimeConfig()
    const supabase = config.public.supabaseUrl && config.public.supabaseKey
      ? createClient(config.public.supabaseUrl, config.public.supabaseKey, {
          auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
        })
      : null
    return { provide: { supabase } }
  }
})
