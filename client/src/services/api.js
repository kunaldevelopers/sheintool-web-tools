import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

export const convertImage = async (formData, onUploadProgress) => {
    return api.post('/convert/image', formData, {
        onUploadProgress,
        responseType: 'blob', // Important for downloading files
    });
};

// Add other API calls here
