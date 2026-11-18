import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import api, { setAccessTokenGetter } from "../services/api"

const AuthContext = createContext(null)

/**
 * Armazenamento seguro de tokens em memória (não persiste no localStorage).
 * O access_token fica apenas em memória (React state).
 * O refresh_token fica em cookie HttpOnly (definido pelo backend, inacessível a JS/XSS).
 *
 * ATENÇÃO: Ao recarregar a página, o access_token é perdido.
 * O interceptor do api.js fará refresh automático usando o refresh_token do cookie HttpOnly
 * (requer withCredentials: true na instância axios para cross-origin localhost:5173 → localhost:8000).
 */
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Registrar getter de token no api service
  useEffect(() => {
    setAccessTokenGetter(() => accessToken)
  }, [accessToken])

  // Ouvir eventos de token refrescado pelo interceptor
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.accessToken
      if (newToken) {
        setAccessToken(newToken)
      }
    }

    window.addEventListener("tokenRefreshed", handleTokenRefreshed)
    return () =>
      window.removeEventListener("tokenRefreshed", handleTokenRefreshed)
  }, [])

  // Inicialização: tentar restaurar sessão do localStorage (apenas access_token)
  // O refresh_token fica em cookie HttpOnly (não acessível via JS)
  useEffect(() => {
    const initAuth = async () => {
      const storedAccess = localStorage.getItem("access_token")

      if (storedAccess) {
        // Tentar validar access_token existente
        try {
          const response = await api.get("api/user/me/")
          setAccessToken(storedAccess)
          setUser(response.data)
        } catch (error) {
          // Access token expirado - o interceptor fará refresh automático
          // usando o refresh_token do cookie HttpOnly (withCredentials: true)
          setAccessToken(null)
          setUser(null)
        }
      }
      setIsInitialized(true)
    }

    initAuth()
  }, [])

  const login = useCallback(async (username, password) => {
    const response = await api.post("api/token/", { username, password })
    const { access } = response.data // Backend retorna apenas access no body; refresh vai em cookie HttpOnly

    // NÃO armazenamos refresh_token no localStorage - ele fica em cookie HttpOnly (segurança)
    // Access token fica apenas em memória (React state)
    setAccessToken(access)

    // Buscar dados do usuário
    const userResponse = await api.get("api/user/me/")
    setUser(userResponse.data)

    // Disparar evento para componentes que ouvem mudança de auth
    window.dispatchEvent(
      new CustomEvent("authChanged", { detail: { isLoggedIn: true } }),
    )

    return response.data
  }, [])

  const logout = useCallback(async () => {
    // Limpar TUDO - defense in depth
    // Primeiro chamar backend para limpar cookie HttpOnly do refresh_token
    try {
      await api.post("api/logout/")
    } catch (e) {
      // Ignorar erros de rede - limpeza local ainda ocorre
      console.warn("Erro ao chamar logout no backend:", e)
    }

    setAccessToken(null)
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_name")
    localStorage.removeItem("user_disciplina")
    localStorage.removeItem("user_avatar")
    localStorage.removeItem("is_superuser")

    // Notificar outros componentes
    window.dispatchEvent(
      new CustomEvent("authChanged", { detail: { isLoggedIn: false } }),
    )

    // Forçar reload para limpar qualquer estado residual
    window.location.href = "/"
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(userData)
  }, [])

  const getAccessToken = useCallback(() => {
    return accessToken
  }, [accessToken])

  const value = {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    isInitialized,
    login,
    logout,
    updateUser,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

export default AuthContext
