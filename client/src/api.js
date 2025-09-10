import axios from 'axios';

// Create a single, configured Axios instance
export const api = axios.create({
    baseURL: 'https://steamybites.onrender.com/api',
});

// This "smart" interceptor checks the URL of each request 
// and attaches the correct token (admin or customer).
api.interceptors.request.use(config => {
    let token;
    
    // If the request is for an admin route, use the admin token.
    if (config.url.startsWith('/admin')) {
        token = localStorage.getItem('admin_token');
    } else {
    // Otherwise, for all other routes (customer, public), use the customer token.
        token = localStorage.getItem('customer_token');
    }
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

