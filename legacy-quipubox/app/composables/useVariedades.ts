import type { Variedad } from '~/types/variedad';

export const useVariedades = () => {
    const variedades = ref<Variedad[]>([]);
    const loading = ref(false);
    const { fetchWithAuth } = useApi();

    const fetchAll = async () => {
        loading.value = true;
        try {
            const data = await fetchWithAuth<Variedad[]>('variedades');
            variedades.value = data;
        } catch (error) {
            console.error('Error fetching variedades:', error);
        } finally {
            loading.value = false;
        }
    };

    const fetchByFruta = async (frutaId: number) => {
        loading.value = true;
        try {
            const data = await fetchWithAuth<Variedad[]>(`variedades/frutas/${frutaId}/variedades`);
            return data;
        } catch (error) {
            console.error('Error fetching variedades by fruta:', error);
            return [];
        } finally {
            loading.value = false;
        }
    };

    const create = async (variedad: Partial<Variedad>) => {
        const newVariedad = await fetchWithAuth<Variedad>('variedades', {
            method: 'POST',
            body: variedad,
        });
        await fetchAll();
        return newVariedad;
    };

    const update = async (id: number, variedad: Partial<Variedad>) => {
        const updated = await fetchWithAuth<Variedad>(`variedades/${id}`, {
            method: 'PUT',
            body: variedad,
        });
        await fetchAll();
        return updated;
    };

    const remove = async (id: number) => {
        await fetchWithAuth(`variedades/${id}`, { method: 'DELETE' });
        await fetchAll();
    };

    return { variedades, loading, fetchAll, fetchByFruta, create, update, remove };
};