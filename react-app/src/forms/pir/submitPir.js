import api from '../../lib/api.js';

export async function savePirDraft({ body, apiClient = api }) {
    return apiClient.post('/api/pirs/draft', body);
}

export default async function submitPir({ body, pirId, isEditing, apiClient = api }) {
    if (isEditing && pirId) {
        return apiClient.put(`/api/pirs/${pirId}`, body);
    }
    return apiClient.post('/api/pirs', body);
}

