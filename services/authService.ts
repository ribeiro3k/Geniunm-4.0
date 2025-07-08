// services/authService.ts
import { User } from '../types';

const MOCK_USER_KEY = 'mock_user';

// Mock user data
const mockAdmin: User = {
  id: 'admin-id',
  nome: 'Admin User',
  email: 'admin@example.com',
  tipo: 'admin',
  senha: 'adminpassword', // In a real app, never store plain text passwords
};

const mockConsultor: User = {
  id: 'consultor-id',
  nome: 'Consultor User',
  email: 'consultor@example.com',
  tipo: 'consultor',
  senha: 'consultorpassword',
};

export const authService = {
  async login(username: string, password?: string): Promise<User | null> {
    console.log(`Attempting login for username: ${username}`);
    if (password) {
      // Admin login
      if (username === 'admin' && password === mockAdmin.senha) {
        sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockAdmin));
        return mockAdmin;
      }
      // Consultor login with password
      if (password === mockConsultor.senha) {
        const user = { ...mockConsultor, nome: username };
        sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        return user;
      }
    } else {
      // Consultor login without password (username only)
      const user = { ...mockConsultor, nome: username };
      sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async logout(): Promise<void> {
    sessionStorage.removeItem(MOCK_USER_KEY);
  },

  getCurrentUser(): User | null {
    const userJson = sessionStorage.getItem(MOCK_USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error("Failed to parse user from session storage", e);
        return null;
      }
    }
    return null;
  },
};
