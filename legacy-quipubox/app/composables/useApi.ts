// composables/useApi.ts
export const useApi = () => {
    const fetchWithAuth = async <T>(
        url: string,
        options?: Record<string, any>
    ): Promise<T> => {
        if (process.server) {
            throw new Error('fetchWithAuth solo puede usarse en cliente');
        }

        const { $supabase } = useNuxtApp();
        if (!$supabase) {
            throw new Error('Supabase no disponible');
        }

        // Obtener sesión actual
        let { data: { session } } = await $supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('No hay sesión activa');
        }

        const config = useRuntimeConfig();
        let base = config.public.apiBase;
        if (!base.endsWith('/')) base += '/';
        const fullUrl = `${base}${url.startsWith('/') ? url.slice(1) : url}`;

        const makeRequest = async (token: string): Promise<T> => {
            const isFormData = options?.body instanceof FormData;
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
                ...(options?.headers ?? {}),
            };
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            // ✅ Solución: forzar el tipo con "as T"
            const data = await $fetch(fullUrl, {
                ...options,
                headers,
            });
            return data as T;
        };

        try {
            return await makeRequest(session.access_token);
        } catch (error: any) {
            if (error.response?.status === 401) {
                const { data: refreshed, error: refreshError } = await $supabase.auth.refreshSession();
                if (refreshError || !refreshed.session) {
                    throw new Error('No se pudo renovar la sesión');
                }
                return await makeRequest(refreshed.session.access_token);
            }
            throw error;
        }
    };

    return { fetchWithAuth };
};