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
 * O refresh_token fica no localStorage (para persistência entre reloads).
 *
 * ATENÇÃO: Ao recarregar a página, o access_token é perdido.
 * O interceptor do api.js fará refresh automático usando o refresh_token do localStorage.
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

  // Inicialização: tentar restaurar sessão do localStorage (apenas refresh_token)
  useEffect(() => {
    const initAuth = async () => {
      const storedRefresh = localStorage.getItem("refresh_token")
      const storedAccess = localStorage.getItem("access_token")

      if (storedRefresh && storedAccess) {
        // Tentar validar access_token existente
        try {
          const response = await api.get("api/user/me/")
          setAccessToken(storedAccess)
          setUser(response.data)
        } catch (error) {
          // Access token expirado - o interceptor fará refresh na próxima request
          // Mantemos o refresh_token para o interceptor usar
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
    const { access, refresh } = response.data

    // Armazenar refresh_token no localStorage (para persistência entre reloads)
    // Access token fica apenas em memória
    localStorage.setItem("refresh_token", refresh)
    // NÃO armazenamos access_token no localStorage - apenas em memória

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

  const logout = useCallback(() => {
    // Limpar TUDO - defense in depth
    setAccessToken(null)
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
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
