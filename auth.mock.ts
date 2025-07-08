
import { AppUser } from './types';

export const mockUser: AppUser = {
  id: 'mock-user-id',
  email: 'mockuser@example.com',
  tipo: 'consultor',
  nome: 'Mock User',
};

export const handleLoginMock = async (
  loginMode: 'consultor' | 'admin',
  username?: string,
  password?: string
): Promise<AppUser> => {
  console.log('Login attempt with mock data:', { loginMode, username, password });
  if (loginMode === 'admin' && password === 'admin123') {
    return { ...mockUser, tipo: 'admin', nome: 'Admin User' };
  }
  if (loginMode === 'consultor' && username) {
    return { ...mockUser, nome: username };
  }
  throw new Error('Invalid credentials');
};
