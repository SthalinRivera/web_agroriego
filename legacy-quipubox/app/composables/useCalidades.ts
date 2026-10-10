import type { Calidad } from '~/types/calidad';

export const useCalidades = () => {
    const calidades = ref<Calidad[]>([]);
    const loading = ref(false);
    const { fetchWithAuth } = useApi();

    const fetchAll = async () => {
        loading.value = true;
        try {
            const data = await fetchWithAuth<Calidad[]>('calidades');
            calidades.value = data;
        } catch (error) {
            console.error('Error fetching calidades:', error);
        } finally {
            loading.value = false;
        }
    };

    const create = async (calidad: Partial<Calidad>) => {
        const newCalidad = await fetchWithAuth<Calidad>('calidades', {
            method: 'POST',
            body: calidad,
        });
        await fetchAll();
        return newCalidad;
    };

    const update = async (id: number, calidad: Partial<Calidad>) => {
        const updated = await fetchWithAuth<Calidad>(`calidades/${id}`, {
            method: 'PUT',
            body: calidad,
        });
        await fetchAll();
        return updated;
    };

    const remove = async (id: number) => {
        await fetchWithAuth(`calidades/${id}`, { method: 'DELETE' });
        await fetchAll();
    };

    return { calidades, loading, fetchAll, create, update, remove };
};