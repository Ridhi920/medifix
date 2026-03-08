import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const userAPI = {
  // Get all users
  getUsers: async (includeInactive: boolean = false): Promise<User[]> => {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      params: { include_inactive: includeInactive },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get a specific user
  getUser: async (userId: number): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update user
  updateUser: async (
    userId: number,
    data: {
      full_name?: string;
      phone?: string;
      role?: string;
      is_active?: boolean;
    }
  ): Promise<User> => {
    const response = await axios.patch(
      `${API_BASE_URL}/users/${userId}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
  },

  // Toggle user status
  toggleUserStatus: async (userId: number): Promise<User> => {
    const response = await axios.patch(
      `${API_BASE_URL}/users/${userId}/toggle-status`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};
