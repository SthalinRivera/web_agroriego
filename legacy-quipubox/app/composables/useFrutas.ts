import type { Fruta } from '~/types/fruta';

export const useFrutas = () => {
    const frutas = ref<Fruta[]>([]);
    const loading = ref(false);
    const { fetchWithAuth } = useApi();

    const fetchAll = async () => {
        loading.value = true;
        try {
            const data = await fetchWithAuth<Fruta[]>('frutas');
            frutas.value = data;
        } catch (error) {
            console.error('Error fetching frutas:', error);
        } finally {
            loading.value = false;
        }
    };

    const create = async (fruta: Partial<Fruta>) => {
        const newFruta = await fetchWithAuth<Fruta>('frutas', {
            method: 'POST',
            body: fruta,
        });
        await fetchAll();
        return newFruta;
    };

    const update = async (id: number, fruta: Partial<Fruta>) => {
        const updated = await fetchWithAuth<Fruta>(`frutas/${id}`, {
            method: 'PUT',
            body: fruta,
        });
        await fetchAll();
        return updated;
    };

    const remove = async (id: number) => {
        await fetchWithAuth(`frutas/${id}`, { method: 'DELETE' });
        await fetchAll();
    };

    return { frutas, loading, fetchAll, create, update, remove };
};