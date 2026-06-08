import apiClient from './axios';

const API_BASE_URL = '/api/medical_records';

export const fetchConsultationNotes = async (patientId = null) => {
    let url = `${API_BASE_URL}/consultation-notes/`;
    if (patientId) url += `?patient=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
};

export const createConsultationNote = async (data) => {
    const response = await apiClient.post(`${API_BASE_URL}/consultation-notes/`, data);
    return response.data;
};

export const fetchPrescriptions = async (patientId = null) => {
    let url = `${API_BASE_URL}/prescriptions/`;
    if (patientId) url += `?patient=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
};

export const createPrescription = async (data) => {
    const response = await apiClient.post(`${API_BASE_URL}/prescriptions/`, data);
    return response.data;
};

export const fetchLabResults = async (patientId = null) => {
    let url = `${API_BASE_URL}/lab-results/`;
    if (patientId) url += `?patient=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
};

export const fetchScanResults = async (patientId = null) => {
    let url = `${API_BASE_URL}/scan-results/`;
    if (patientId) url += `?patient=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
};

export const fetchDrugs = async () => {
    const response = await apiClient.get(`${API_BASE_URL}/drugs/`);
    return response.data;
};

export const checkDrugInteractions = async (drugIds) => {
    const response = await apiClient.post(`${API_BASE_URL}/drugs/check_interactions/`, { drug_ids: drugIds });
    return response.data;
};
export const searchDrugs = async (query, limit = 10, page = 1) => {
    const response = await apiClient.get(`${API_BASE_URL}/drugs/search?q=${query}&limit=${limit}&page=${page}`);
    return response.data;
};
