import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const fetchAnnouncements = async (token) => {
  const { data } = await apiClient.get('/announcements', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createAnnouncement = async ({ token, ...payload }) => {
  const { data } = await apiClient.post('/announcements', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const fetchAllUsers = async (token) => {
  const { data } = await apiClient.get('/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

