import { AppUser, CurrentUserType } from './types';
import { NAV_ITEMS, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX, ADMIN_FIXED_PASSWORD, LOCAL_STORAGE_CURRENT_USER_KEY, TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from './constants';

export const mockUser: AppUser = {
    id: 'mock_user_id',
    nome: 'Mock User',
    tipo: 'consultor',
    email: 'mock.user@example.com',
    criado_em: new Date().toISOString(),
};

export const handleLoginMock = async (
    usernameOrAdminKeyword: string,
    passwordInput: string,
    isTryingAdminLogin: boolean,
    setCurrentUser: (user: CurrentUserType) => void,
    setAuthError: (error: string | null) => void,
    setIsLoadingAuth: (loading: boolean) => void,
    navigate: (path: string, options: { replace: boolean }) => void
): Promise<string | null> => {
    setAuthError(null);
    setIsLoadingAuth(true);

    if (isTryingAdminLogin) {
        if (passwordInput === ADMIN_FIXED_PASSWORD) {
            const adminUser: AppUser = {
                id: 'admin_fixed_user',
                nome: 'Administrador',
                tipo: 'admin',
            };
            setCurrentUser(adminUser);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(adminUser));
            localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${adminUser.id}`, new Date().toISOString());
            navigate(`/admin`, { replace: true });
            setIsLoadingAuth(false);
            return null; // Success
        } else {
            setAuthError("Senha de administrador incorreta.");
            setIsLoadingAuth(false);
            return "Senha de administrador incorreta.";
        }
    } else {
        // Mocked consultant login
        if (usernameOrAdminKeyword === 'consultor' && passwordInput === 'password') {
            setCurrentUser(mockUser);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(mockUser));
            localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${mockUser.id}`, new Date().toISOString());
            navigate(`/home`, { replace: true });
            setIsLoadingAuth(false);
            return null; // Success
        } else {
            setAuthError("Nome de usuário ou senha do consultor incorretos.");
            setIsLoadingAuth(false);
            return "Nome de usuário ou senha do consultor incorretos.";
        }
    }
};
