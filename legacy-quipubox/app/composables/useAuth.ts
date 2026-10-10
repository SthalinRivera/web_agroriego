// composables/useAuth.ts

import {
    useCookie,
    useState,
    navigateTo,
    computed,
    useRuntimeConfig,
} from '#imports'

export const useAuth = () => {

    const config =
        useRuntimeConfig()

    // =========================
    // GLOBAL STATE
    // =========================

    const token =
        useCookie<string | null>(
            'access_token',
            {
                path: '/',

                maxAge:
                    60 * 60 * 24 * 7,

                sameSite: 'lax',

                secure:
                    process.env.NODE_ENV ===
                    'production',
            },
        )

    const user =
        useState<any>(
            'auth-user',
            () => null,
        )

    const loading =
        useState<boolean>(
            'auth-loading',
            () => false,
        )

    // =========================
    // COMPUTED
    // =========================

    const isAuthenticated =
        computed(
            () => !!token.value,
        )

    // =========================
    // LOGIN GOOGLE
    // =========================

    const loginWithGoogle =
        async () => {

            loading.value = true

            try {
                const { $supabase } = useNuxtApp()

                const { error } =
                    await $supabase.auth
                        .signInWithOAuth({

                            provider:
                                'google',

                            options: {

                                redirectTo:
                                    `${window.location.origin}/auth/callback`,
                            },
                        })

                if (error) {
                    console.error(
                        'GOOGLE LOGIN ERROR:',
                        error,
                    )
                }

            } catch (error) {

                console.error(
                    'LOGIN ERROR:',
                    error,
                )

            } finally {

                loading.value = false
            }
        }

    // =========================
    // FETCH USER
    // =========================

    const fetchUser =
        async () => {

            loading.value = true

            try {
                let jwtToken = token.value

                // Si estamos en el cliente, sincronizamos con la sesión de Supabase
                if (process.client) {
                    const { $supabase } = useNuxtApp()
                    if ($supabase) {
                        const {
                            data: { session },
                            error: sessionError,
                        } = await $supabase.auth.getSession()

                        if (sessionError) {
                            console.error(
                                'SESSION ERROR:',
                                sessionError,
                            )
                            token.value = null
                            user.value = null
                            return null
                        }

                        if (!session) {
                            token.value = null
                            user.value = null
                            return null
                        }

                        jwtToken = session.access_token
                        token.value = session.access_token
                    }
                }

                if (!jwtToken) {
                    user.value = null
                    return null
                }

                // Consumir API NestJS
                const profile =
                    await $fetch(

                        `${config.public.apiBase}/auth/profile`,

                        {
                            headers: {

                                Authorization:
                                    `Bearer ${jwtToken}`,
                            },
                        },
                    )

                // Guardar usuario global
                user.value = profile

                return profile

            } catch (error) {

                console.error(
                    'FETCH USER ERROR:',
                    error,
                )

                token.value = null
                user.value = null

                return null

            } finally {

                loading.value = false
            }
        }

    // =========================
    // LOGOUT
    // =========================

    const logout =
        async () => {

            loading.value = true

            try {
                const { $supabase } = useNuxtApp()

                await $supabase.auth
                    .signOut()

            } catch (error) {

                console.error(
                    'LOGOUT ERROR:',
                    error,
                )

            } finally {

                token.value = null
                user.value = null

                loading.value = false

                navigateTo('/login')
            }
        }

    // =========================
    // RESTORE SESSION
    // =========================

    const restoreSession =
        async () => {

            if (!user.value && token.value) {

                await fetchUser()
            }
        }

    // =========================
    // AUTO LISTENER
    // =========================

    if (process.client) {
        const nuxtApp = useNuxtApp()
        nuxtApp.hook('app:created', () => {
            const { $supabase } = useNuxtApp()
            if ($supabase) {
                $supabase.auth
                    .onAuthStateChange(

                        async (event, session) => {

                            // LOGIN / INITIAL_SESSION
                            if (
                                (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
                                session
                            ) {

                                token.value =
                                    session.access_token

                                if (!user.value) {
                                    await fetchUser()
                                }
                            }

                            // LOGOUT
                            if (
                                event === 'SIGNED_OUT'
                            ) {

                                token.value = null
                                user.value = null
                            }

                            // TOKEN REFRESH
                            if (
                                event ===
                                'TOKEN_REFRESHED'
                            ) {

                                token.value =
                                    session?.access_token ||
                                    null
                            }
                        },
                    )
            }
        })
    }

    return {

        // state
        token,
        user,
        loading,

        // computed
        isAuthenticated,

        // methods
        loginWithGoogle,
        fetchUser,
        logout,
        restoreSession,
    }
}