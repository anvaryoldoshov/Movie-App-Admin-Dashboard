import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = "http://62.84.177.49";

// Get or generate deviceId
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = uuidv4();
  localStorage.setItem("deviceId", deviceId);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

function logout({ keepDeviceId = true } = {}) {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  if (!keepDeviceId) {
    localStorage.removeItem('deviceId');
  }
  window.location.href = '/login';
}

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.url.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log('Sending X-Device-Id:', deviceId, 'for URL:', config.url);
    config.headers['X-Device-Id'] = deviceId;
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 403 || error.response?.status === 401;
    const isNotRefreshRequest = !originalRequest.url.includes('/auth/refresh');
    const hasNotRetried = !originalRequest._retry;

    if (isUnauthorized && isNotRefreshRequest && hasNotRetried) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token available, logging out');
        logout();
        return Promise.reject(error);
      }

      try {
        // console.log('Attempting token refresh with refreshToken:', refreshToken, 'and deviceId:', deviceId);
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken, deviceId }, {
            headers: { 'X-Device-Id': deviceId }
          });
        const { token: newAccessToken, refreshToken: newRefreshToken, deviceId: responseDeviceId } = response.data;
        // console.log('Refresh token response:', response.data);

        if (!responseDeviceId) {
          console.warn('No deviceId in refresh response, using existing deviceId:', deviceId);
        } else if (responseDeviceId !== deviceId) {
          console.warn('Device ID updated from response:', responseDeviceId);
          deviceId = responseDeviceId;
          localStorage.setItem('deviceId', responseDeviceId);
        }

        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError.response?.data || refreshError.message);
        if (refreshError.response?.status === 403 || refreshError.response?.status === 401) {
          console.error('Refresh token invalid, logging out');
          logout();
        }
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error('Request failed:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// AUTH FUNCTIONS
export const googleLogin = async (idToken) => {
  try {
    // console.log('Sending idToken:', idToken, 'with deviceId:', deviceId);
    const response = await api.post('/auth/google', {
      credential: idToken,
      deviceId,
    });
    // console.log('Google login response:', response.data);
    const { token, refreshToken, deviceId: responseDeviceId } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    if (!responseDeviceId) {
      console.warn('No deviceId in login response, using existing deviceId:', deviceId);
    } else if (responseDeviceId !== deviceId) {
      console.warn('Updating deviceId from response:', responseDeviceId);
      deviceId = responseDeviceId;
      localStorage.setItem('deviceId', responseDeviceId);
    }
    return response.data;
  } catch (error) {
    console.error('Google login error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Google login failed';
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/sign-in', {
      email,
      password,
      deviceId,
    });
    const { token, refreshToken, deviceId: responseDeviceId } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    if (responseDeviceId && responseDeviceId !== deviceId) {
      deviceId = responseDeviceId;
      localStorage.setItem('deviceId', responseDeviceId);
    }
    return response.data;
  } catch (error) {
    console.error('Sign-in error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Email yoki parol noto\'g\'ri';
  }
};

// BANNER FUNCTIONS
export const getBanners = async () => {
  try {
    const response = await api.get('/banners/all-banners');
    console.log('API Banners Response Data:', response.data); 
    return response.data;
  } catch (error) {
    console.error('Get banners error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch banners';
  }
};

export const addBanner = async (seriesId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post(`/banners/${seriesId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Add banner error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to add banner';
  }
};

export const createBanner = async (bannerData, seriesId) => {
  try {
    const response = await api.post(`/banners/${seriesId}`, bannerData);
    return response.data;
  } catch (error) {
    console.error('Create banner error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to create banner';
  }
};

export const updateBanner = async (bannerId, imageFile, oldImageUrl, seriesId) => {
  const formData = new FormData();
  
  // 1. Agar yangi rasm fayli mavjud bo'lsa, uni qo'shing
  if (imageFile) {
    formData.append('image', imageFile);
  } 
  // 2. Aks holda, oldingi rasm URL manzilini 'imageUrl' nomi bilan jo'nating
  else if (oldImageUrl) {
    formData.append('imageUrl', oldImageUrl);
  }
  
  // seriesId har doim majburiy
  formData.append('seriesId', seriesId);

  const response = await api.put(`/banners/${bannerId}/${seriesId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteBanner = async (id, seriesId) => {
  try {
    const response = await api.delete(`/banners/${id}/${seriesId}`);
    return response.data;
  } catch (error) {
    console.error('Delete banner error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to delete banner';
  }
};

// OTHER API FUNCTIONS
export const getAllUsers = async () => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

export const getAllSeries = async () => {
  try {
    const response = await api.get("/series/all");
    return response.data;
  } catch (error) {
    console.error('Get all series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch series';
  }
};

export const getSeries = async () => {
  try {
    const response = await api.get('/series/all');
    return response.data;
  } catch (error) {
    console.error('Get series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch series';
  }
};

export const getSeriesDetails = async (id) => {
  try {
    const response = await api.get(`/series/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get series details error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch series details';
  }
};

export const getEpisodesBySeries = async (seriesId) => {
  try {
    const response = await api.get(`/series/${seriesId}/episodes`);
    return response.data;
  } catch (error) {
    console.error('Get episodes by series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch episodes';
  }
};

export const getEpisode = async (seriesId, episodeId) => {
  try {
    const response = await api.get(`/series/${seriesId}/episode/${episodeId}`);
    return response.data;
  } catch (error) {
    console.error('Get episode error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch episode';
  }
};

export const getAllVideos = async () => {
  try {
    const response = await api.get("/admin/series/all");
    return response.data;
  } catch (error) {
    console.error('Get all videos error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch videos';
  }
};

export const createSeries = async (formData) => {
  try {
    const response = await api.post("/series/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error('Create series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to create series';
  }
};

export const updateSeries = async (seriesId, formData) => {
  try {
    const response = await api.put(`/series/${seriesId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error('Update series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to update series';
  }
};

export const deleteSeries = async (seriesId) => {
  try {
    const response = await api.delete(`/series/delete/${seriesId}`);
    return response.data;
  } catch (error) {
    console.error('Delete series error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to delete series';
  }
};

export const createEpisode = async (seriesId, formData) => {
  try {
    const response = await api.post(`/admin/series/${seriesId}/episodes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error('Create episode error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to create episode';
  }
};

export const updateEpisode = async (episodeId, formData) => {
  try {
    const response = await api.put(`/admin/series/episodes/${episodeId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error('Update episode error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to update episode';
  }
};

export const deleteEpisode = async (episodeId) => {
  try {
    const response = await api.delete(`/admin/series/episodes/${episodeId}`);
    return response.data;
  } catch (error) {
    console.error('Delete episode error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to delete episode';
  }
};

// Davomiylik/hajmi hali Bunny'dan to'liq olinmagan epizodlarni qayta urinib to'ldiradi
export const backfillEpisodeDurations = async () => {
  try {
    const response = await api.post('/admin/series/episodes/backfill-duration');
    return response.data;
  } catch (error) {
    console.error('Backfill episode durations error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to backfill episode durations';
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to update user';
  }
};

export const makeAdmin = async (userId) => {
  try {
    const response = await api.put(`/users/${userId}/make-admin`);
    return response.data;
  } catch (error) {
    console.error('Make admin error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to make admin';
  }
};

export const giveAccessMovie = async (userId, seriesId, paid = true) => {
  try {
    const res = await api.post(`/api/access`, null, {
      params: { userId, seriesId, paid },
    });
    return res.data;
  } catch (err) {
    console.error("Give access error:", err.response?.data || err.message);
    throw err;
  }
};

export const getAllAccess = async () => {
  try {
    const res = await api.get("/api/access");
    return res.data;
  } catch (err) {
    console.error("Get access error:", err.response?.data || err.message);
    throw err;
  }
};

export const getUserAccessedSeries = async (userId) => {
  try {
    const res = await api.get(`/api/access/user/${userId}`);
    return res.data; // Array of seriesId
  } catch (err) {
    console.error("Get user accessed series error:", err.response?.data || err.message);
    return [];
  }
};

export const updateUserAccess = async (userId, seriesIds) => {
  const { data } = await api.put(`/api/access/user/${userId}`, seriesIds);
  return data;
};

// Foydalanuvchidan bitta serial accessini o'chirish
export const deleteAccessMovie = async (userId, movieId) => {
  const { data } = await api.delete(`api/access`, {
    params: { userId, movieId },
  });
  return data;
};

export const getAllUsersWithAccess = async () => {
    const { data } = await api.get("/api/access/all-with-series");
    return data;
}
export default api;