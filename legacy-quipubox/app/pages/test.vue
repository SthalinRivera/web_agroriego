<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gray-100 p-6"
    >

        <div
            class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        >

            <!-- HEADER -->
            <div class="flex flex-col items-center">

                <img
                    v-if="user?.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.nombres"
                    class="w-24 h-24 rounded-full border-4 border-gray-200 shadow-md"
                >

                <div
                    v-else
                    class="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-white"
                >
                    {{ initials }}
                </div>

                <h1
                    class="mt-4 text-2xl font-bold text-gray-800"
                >
                    {{ user?.nombres }}
                    {{ user?.apellidos }}
                </h1>

                <p
                    class="text-gray-500"
                >
                    {{ user?.email }}
                </p>
            </div>

            <!-- INFO -->
            <div class="mt-8 space-y-4">

                <div
                    class="bg-gray-50 rounded-xl p-4"
                >
                 

                  <div >
                    <p class="text-sm text-gray-500">Empresa</p>
                    <p class="font-semibold text-gray-800">
                        {{ user?.empresa?.nombre_comercial || user?.empresa?.razon_social || 'Sin empresa' }}
                    </p>
</div>
                </div>

                <div
                    class="bg-gray-50 rounded-xl p-4"
                >
                    <p class="text-sm text-gray-500">
                        Rol
                    </p>

                    <p class="font-semibold text-gray-800">
                        {{ user?.rol?.nombre || 'Sin rol' }}
                    </p>
                </div>

                <div
                    class="bg-gray-50 rounded-xl p-4"
                >
                    <p class="text-sm text-gray-500">
                        Sede
                    </p>

                    <p class="font-semibold text-gray-800">
                        {{ user?.sede?.nombre || 'Sin sede' }}
                    </p>
                </div>

            </div>

            <!-- ACTIONS -->
            <div class="mt-8 flex flex-col gap-4">

                <button
                    @click="handleRefresh"
                    :disabled="loading"
                    class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                    Refrescar Perfil
                </button>

                <button
                    @click="handleLogout"
                    :disabled="loading"
                    class="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                    Cerrar Sesión
                </button>

            </div>

        </div>

    </div>
</template>

<script setup lang="ts">

const {
    user,
    logout,
    fetchUser,
    loading,
} = useAuth()

// SI NO HAY USUARIO
onMounted(async () => {

    if (!user.value) {

        await fetchUser()
    }
})

// INICIALES
const initials =
    computed(() => {

        if (!user.value) {
            return 'U'
        }

        return `${user.value.nombres?.[0] || ''}${user.value.apellidos?.[0] || ''}`
            .toUpperCase()
    })

// REFRESH
const handleRefresh =
    async () => {

        await fetchUser()
    }

// LOGOUT
const handleLogout =
    async () => {

        await logout()
    }

</script>