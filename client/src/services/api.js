import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Generation APIs
export const generateImage = async (params) => {
  try {
    const response = await api.post('/generate', params);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateDirect = async (params) => {
  try {
    const response = await api.post('/generate/direct', params);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getJobStatus = async (jobId) => {
  try {
    const response = await api.get(`/generate/status/${jobId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const fetchProviders = async () => {
  try {
    const response = await api.get('/generate/providers');
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    return { providers: [] };
  }
};

export const fetchSamplers = async () => {
  try {
    const response = await api.get('/generate/samplers');
    return response.data;
  } catch (error) {
    console.error('Error fetching samplers:', error);
    return [];
  }
};

export const fetchStyles = async () => {
  try {
    const response = await api.get('/generate/styles');
    return response.data;
  } catch (error) {
    console.error('Error fetching styles:', error);
    return { categories: {}, presets: [] };
  }
};

// Upscaling APIs
export const upscaleImage = async (formData) => {
  try {
    const response = await api.post('/upscale', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const fetchUpscaleModels = async () => {
  try {
    const response = await api.get('/upscale/models');
    return response.data;
  } catch (error) {
    console.error('Error fetching upscale models:', error);
    return [];
  }
};

// Editing APIs
export const inpaintImage = async (formData) => {
  try {
    const response = await api.post('/edit/inpaint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const outpaintImage = async (formData) => {
  try {
    const response = await api.post('/edit/outpaint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateVariations = async (formData) => {
  try {
    const response = await api.post('/edit/variations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const imageToImage = async (formData) => {
  try {
    const response = await api.post('/edit/img2img', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Gallery APIs
export const fetchGallery = async () => {
  try {
    const response = await api.get('/gallery');
    return response.data;
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return { images: [], total: 0 };
  }
};

export const searchGallery = async (params) => {
  try {
    const response = await api.get('/gallery/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching gallery:', error);
    return { images: [], total: 0 };
  }
};

export const deleteImage = async (filename) => {
  try {
    const response = await api.delete(`/gallery/${filename}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Workspace APIs
export const fetchWorkspaces = async () => {
  try {
    const response = await api.get('/workspace');
    return response.data;
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return { workspaces: [] };
  }
};

export const createWorkspace = async (data) => {
  try {
    const response = await api.post('/workspace', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkspace = async (id) => {
  try {
    const response = await api.get(`/workspace/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateWorkspace = async (id, data) => {
  try {
    const response = await api.put(`/workspace/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteWorkspace = async (id) => {
  try {
    const response = await api.delete(`/workspace/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const addImageToWorkspace = async (workspaceId, imageData) => {
  try {
    const response = await api.post(`/workspace/${workspaceId}/images`, imageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Utility
export const getImageUrl = (filename) => {
  if (filename.startsWith('http')) return filename;
  if (filename.startsWith('/uploads/')) return `${API_BASE_URL.replace('/api', '')}${filename}`;
  return `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'error' };
  }
};

export default api;