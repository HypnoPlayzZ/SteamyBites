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
    // Use the secure HTTPS endpoint for your backend
    baseURL: 'https://steamy-bites-env.eba-27a3c3b2.us-east-1.elasticbeanstalk.com/api',
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

