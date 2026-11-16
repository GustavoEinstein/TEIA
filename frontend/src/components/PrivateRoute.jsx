import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

/**
 * Rota privada com validação no servidor (defense in depth).
 * Verifica se o token JWT é válido chamando /api/user/me/ antes de renderizar.
 * Também suporta verificação de roles para rotas administrativas.
 */
const PrivateRoute = ({ requireAdmin = false, requireSuperuser = false }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const validateToken = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        if (mounted) {
          setIsValidating(false);
          setIsAuthenticated(false);
        }
        return;
      }

      try {
        // Validar token no servidor
        const response = await api.get('api/user/me/');
        const user = response.data;

        if (!mounted) return;

        // Verificar se usuário está aprovado (conforme backend)
        if (user.status_conta && user.status_conta !== 'Aprovado') {
          // Conta não aprovada - limpar tokens e redirecionar
          localStorage.clear();
          setIsAuthenticated(false);
          return;
        }

        // Verificar requisitos de role
        const isAdmin = user.is_staff === true || user.is_superuser === true;
        const isSuperuser = user.is_superuser === true;

        if (requireSuperuser && !isSuperuser) {
          if (mounted) {
            setIsAuthenticated(false);
          }
          return;
        }

        if (requireAdmin && !isAdmin) {
          if (mounted) {
            setIsAuthenticated(false);
          }
          return;
        }

        // Token válido e permissões OK
        if (mounted) {
          setUserData(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token inválido, expirado ou erro de rede
        if (mounted) {
          // Se for 401, o interceptor do api.js já tenta refresh
          // Se falhar, localStorage já foi limpo
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsValidating(false);
        }
      }
    };

    validateToken();

    return () => {
      mounted = false;
    };
  }, [requireAdmin, requireSuperuser, location.pathname]);

  // Mostrar loading durante validação
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
        <div className="animate-pulse text-slate-400 dark:text-slate-500 font-bold flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-[#1565C0] dark:text-blue-500 animate-spin" />
          <p>Validando sessão...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Autenticado e autorizado - renderizar conteúdo
  return <Outlet />;
};

/**
 * Wrapper para rotas que exigem permissão de admin (staff ou superuser)
 */
export const AdminRoute = ({ children }) => (
  <PrivateRoute requireAdmin>{children}</PrivateRoute>
);

/**
 * Wrapper para rotas que exigem permissão de superuser
 */
export const SuperuserRoute = ({ children }) => (
  <PrivateRoute requireSuperuser>{children}</PrivateRoute>
);

export default PrivateRoute;