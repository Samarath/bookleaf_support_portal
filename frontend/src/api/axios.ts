import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Intercept requests to attach auth headers automatically
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");
  const role = localStorage.getItem("role");
  
  if (userStr && role) {
    const user = JSON.parse(userStr);
    config.headers['X-User-Email'] = user.email;
    config.headers['X-User-Role'] = role;
    if (role === 'AUTHOR') {
      config.headers['X-Author-ID'] = user.author_id;
    }
  }
  return config;
});