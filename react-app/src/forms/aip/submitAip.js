import api from '../../lib/api.js';

export async function saveAipDraft({ body, apiClient = api }) {
    return apiClient.post('/api/aips/draft', body);
}

export default async function submitAip({ body, aipId, isEditing, apiClient = api }) {
    if (isEditing && aipId) {
        return apiClient.put(`/api/aips/${aipId}`, body);
    }
    return apiClient.post('/api/aips', body);
}

