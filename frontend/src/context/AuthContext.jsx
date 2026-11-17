import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAccessTokenGetter } from '../services/api';

const AuthContext = createContext(null);

/**
 * Armazenamento seguro de tokens - HttpOnly Cookie + Memory
 *
 * ACCESS TOKEN: Apenas em memória (React state) - nunca no localStorage
 * REFRESH TOKEN: HttpOnly Cookie (definido pelo backend) - inacessível a JavaScript/XSS
 *
 * Fluxo de inicialização (initAuth):
 * 1. Chama POST /api/token/refresh/ (cookie HttpOnly enviado automaticamente)
 * 2. Se sucesso, recebe novo access_token
 * 3. GET /api/user/me/ para dados do usuário
 * 4. Define accessToken em memória e user no state
 *
 * Fluxo de Login:
 * 1. POST /api/token/ com username/password
 * 2. Backend define cookie HttpOnly com refresh_token
 * 3. Resposta contém APENAS access_token (refresh não exposto ao JS)
 * 4. Define accessToken em memória
 * 5. GET /api/user/me/ para dados do usuário
 */
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Registrar getter de token no api service (sempre atualizado)
  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  // Ouvir eventos de token refrescado pelo interceptor do api.js
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        // Atualizar getter imediatamente para próximas requests
        setAccessTokenGetter(() => newToken);
      }
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    return () => window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
  }, []);

  // Inicialização: restaurar sessão via cookie HttpOnly
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Obter novo access_token via refresh_token (cookie HttpOnly)
        // withCredentials: true no api.js garante que o cookie seja enviado
        const refreshResponse = await api.post('api/token/refresh/');

        const newAccessToken = refreshResponse.data.access;
        if (!mounted) return;

        // 2. Definir access_token em memória
        setAccessToken(newAccessToken);

        // Atualizar getter do token IMEDIATAMENTE para a próxima request
        setAccessTokenGetter(() => newAccessToken);

        // 3. Buscar dados do usuário com o novo token
        const userResponse = await api.get('api/user/me/');
        if (!mounted) return;

        // 4. Verificar se conta está aprovada (regra do backend)
        const userData = userResponse.data;
        if (userData.status_conta && userData.status_conta !== 'Aprovado') {
          // Conta não aprovada - limpar estado
          setAccessToken(null);
          setUser(null);
        } else {
          setUser(userData);
        }
      } catch (error) {
        // Refresh token inválido/expirado/ausente - sem sessão válida
        console.warn('[AuthContext] Sessão não restaurada:', error.message);
        if (mounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setIsInitialized(true);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await api.post('api/token/', { username, password });

    // Backend retorna APENAS access_token no body
    // O refresh_token foi definido em cookie HttpOnly pelo backend
    const { access } = response.data;

    setAccessToken(access);

    // Atualizar getter do token IMEDIATAMENTE para a próxima request
    setAccessTokenGetter(() => access);

    // Buscar dados do usuário
    const userResponse = await api.get('api/user/me/');
    const userData = userResponse.data;

    // Verificar aprovação da conta
    if (userData.status_conta && userData.status_conta !== 'Aprovado') {
      setAccessToken(null);
      setUser(null);
      throw new Error('Conta não aprovada. Aguarde aprovação do administrador.');
    }

    setUser(userData);

    // Notificar mudança de auth
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { isLoggedIn: true } }));

    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Chamar endpoint de logout no backend para limpar cookie HttpOnly
      await api.post('api/logout/');
    } catch (error) {
      console.warn('[AuthContext] Erro ao fazer logout no backend:', error.message);
    }

    // Limpar estado local (access_token em memória)
    setAccessToken(null);
    setUser(null);

    // Notificar outros componentes
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { isLoggedIn: false } }));

    // Forçar reload para limpar estado residual
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]);

  const value = {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    isInitialized,
    login,
    logout,
    updateUser,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;