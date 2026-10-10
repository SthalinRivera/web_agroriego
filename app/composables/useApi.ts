import type { AgroRecord, PageResult } from '~/types/agro'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined>
  body?: Record<string, unknown>
}

export const useApi = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()
  const { token, user } = useAuth()
  const request = async <T>(
    path: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    if (!$supabase) throw new Error('Supabase no está configurado')
    const { data, error } = await $supabase.auth.getSession()
    if (error || !data.session) {
      token.value = null
      user.value = null
      await navigateTo('/login')
      throw new Error('Sesión vencida')
    }
    const send = (jwt: string) =>
      $fetch<T>(
        `${config.public.apiBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        {
          ...options,
          timeout: 20000,
          retry: 0,
          headers: { Authorization: `Bearer ${jwt}` }
        }
      )
    try {
      return (await send(data.session.access_token)) as T
    } catch (cause) {
      if ((cause as { statusCode?: number }).statusCode !== 401) throw cause
      const refreshed = await $supabase.auth.refreshSession()
      if (refreshed.error || !refreshed.data.session) {
        await $supabase.auth.signOut({ scope: 'local' })
        token.value = null
        user.value = null
        await navigateTo('/login')
        throw cause
      }
      token.value = refreshed.data.session.access_token
      return (await send(token.value)) as T
    }
  }
  const all = async (endpoint: string): Promise<AgroRecord[]> => {
    const rows: AgroRecord[] = []
    let page = 1
    while (true) {
      const result = await request<PageResult>(endpoint, {
        query: { page, limit: 100 }
      })
      rows.push(...result.data)
      if (page >= result.meta.totalPages || result.data.length === 0) break
      page++
    }
    return rows
  }
  return { request, all }
}
