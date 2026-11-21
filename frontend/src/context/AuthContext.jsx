import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import api, {
  setAccessTokenGetter,
  setInMemoryAccessToken,
} from "../services/api"

const AuthContext = createContext(null)

/**
 * Armazenamento seguro de tokens:
 * - access_token fica apenas em memória (React state + variável síncrona no api.js).
 * - refresh_token fica em cookie HttpOnly (gerenciado pelo backend).
 */
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Mantém o getter sincronizado com o estado do React
  useEffect(() => {
    setInMemoryAccessToken(accessToken)
    setAccessTokenGetter(() => accessToken)
  }, [accessToken])

  // Ouve eventos de token renovado pelo interceptor
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.accessToken
      if (newToken) {
        setInMemoryAccessToken(newToken)
        setAccessToken(newToken)
      }
    }

    window.addEventListener("tokenRefreshed", handleTokenRefreshed)
    return () =>
      window.removeEventListener("tokenRefreshed", handleTokenRefreshed)
  }, [])

  // Inicialização: tenta restaurar a sessão silenciosamente usando o cookie HttpOnly
  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshResponse = await api.post("api/token/refresh/")
        const newAccess = refreshResponse.data?.access

        if (newAccess) {
          // Atualiza de forma SÍNCRONA antes de chamar /api/user/me/
          setInMemoryAccessToken(newAccess)
          setAccessToken(newAccess)

          const userResponse = await api.get("api/user/me/", {
            headers: { Authorization: `Bearer ${newAccess}` },
          })
          setUser(userResponse.data)
        }
      } catch {
        // Sem cookie válido (usuário deslogado) — segue fluxo normal
        setInMemoryAccessToken(null)
        setAccessToken(null)
        setUser(null)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (username, password) => {
    const response = await api.post("api/token/", { username, password })
    const { access } = response.data

    if (!access) {
      throw new Error("Token de acesso não retornado pelo servidor.")
    }

    // Atualiza o token de forma SÍNCRONA no api.js antes da próxima requisição
    setInMemoryAccessToken(access)
    setAccessToken(access)

    // Busca dados do usuário já enviando o Bearer token explicitamente
    const userResponse = await api.get("api/user/me/", {
      headers: { Authorization: `Bearer ${access}` },
    })
    setUser(userResponse.data)

    window.dispatchEvent(
      new CustomEvent("authChanged", { detail: { isLoggedIn: true } }),
    )

    return response.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("api/logout/")
    } catch (e) {
      console.warn("Erro ao chamar logout no backend:", e)
    }

    setInMemoryAccessToken(null)
    setAccessToken(null)
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_name")
    localStorage.removeItem("user_disciplina")
    localStorage.removeItem("user_avatar")
    localStorage.removeItem("is_superuser")

    window.dispatchEvent(
      new CustomEvent("authChanged", { detail: { isLoggedIn: false } }),
    )

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
