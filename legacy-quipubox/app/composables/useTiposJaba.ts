import type { TipoJaba } from '~/types/tipoJaba';

export const useTiposJaba = () => {
    const tiposJaba = ref<TipoJaba[]>([]);
    const loading = ref(false);
    const { fetchWithAuth } = useApi();

    const fetchAll = async () => {
        loading.value = true;
        try {
            const data = await fetchWithAuth<TipoJaba[]>('tipos-jaba');
            tiposJaba.value = data;
        } catch (error) {
            console.error('Error fetching tipos de jaba:', error);
        } finally {
            loading.value = false;
        }
    };

    const create = async (tipo: Partial<TipoJaba>) => {
        const newTipo = await fetchWithAuth<TipoJaba>('tipos-jaba', {
            method: 'POST',
            body: tipo,
        });
        await fetchAll();
        return newTipo;
    };

    const update = async (id: number, tipo: Partial<TipoJaba>) => {
        const updated = await fetchWithAuth<TipoJaba>(`tipos-jaba/${id}`, {
            method: 'PUT',
            body: tipo,
        });
        await fetchAll();
        return updated;
    };

    const remove = async (id: number) => {
        await fetchWithAuth(`tipos-jaba/${id}`, { method: 'DELETE' });
        await fetchAll();
    };

    return { tiposJaba, loading, fetchAll, create, update, remove };
};