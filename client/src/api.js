import axios from 'axios';

// Create an Axios instance for the admin portal
const api = axios.create({
    // IMPORTANT: Replace this with your actual Vercel backend URL
    baseURL: 'https://steamy-bites.vercel.app/api', 
});

// Use an interceptor to attach the admin token to all requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { api };

