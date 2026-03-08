import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL Configuration
// Choose the correct URL based on your testing device:

// OPTION 1: iOS Simulator
// const API_BASE_URL = 'http://localhost:8000';

// OPTION 2: Android Emulator
// const API_BASE_URL = 'http://10.0.2.2:8000';

// OPTION 3: Physical Device or safer default (YOUR COMPUTER'S IP)
const API_BASE_URL = 'http://10.175.59.188:8000';

// Auto-detect (uncomment to use):
// const API_BASE_URL = Platform.select({
//   ios: 'http://localhost:8000',
//   android: 'http://10.0.2.2:8000',
//   default: 'http://10.175.59.188:8000'
// });

console.log('🌐 API connecting to:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      await AsyncStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authAPI = {
  // Sign up a new user
  signup: async (data: SignupData): Promise<User> => {
    const response = await api.post<User>('/auth/signup', data);
    return response.data;
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // Store token
    await AsyncStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('access_token');
  },
};

export default api;
