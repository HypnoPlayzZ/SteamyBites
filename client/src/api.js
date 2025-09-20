import axios from 'axios';

// A helper function to determine which token to use
const getToken = (url) => {
    if (url.startsWith('/admin')) {
        return localStorage.getItem('admin_token');
    }
    return localStorage.getItem('customer_token');
};

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8001/api', // Or your live backend URL
});

// Use an interceptor to dynamically add the correct auth token
api.interceptors.request.use(config => {
    const token = getToken(config.url);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { api };

