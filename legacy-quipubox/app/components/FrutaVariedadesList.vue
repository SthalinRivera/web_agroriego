<script setup lang="ts">
const props = defineProps<{ frutaId: number }>();
const { fetchByFruta } = useVariedades();
const variedades = ref([]);

onMounted(async () => {
  variedades.value = await fetchByFruta(props.frutaId);
});
</script>
<template>
  <div v-for="v in variedades" :key="v.id_variedad">
    {{ v.nombre }}
  </div>
</template>