import axios from "axios"

/**
 * Determina a base URL da API.
 * - Se VITE_API_URL começar com "/" → usa URL relativa (nginx proxy em produção)
 * - Se VITE_API_URL for URL absoluta → usa como está (desenvolvimento)
 * - Fallback → localhost:8000 (dev local)
 */
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return "http://localhost:8000/"
  if (envUrl.startsWith("/")) return envUrl
  return envUrl
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Envia e recebe cookies HttpOnly
})

// Token em memória sincronizado imediatamente (evita race condition do React state)
let inMemoryAccessToken = null
let getAccessTokenFn = () => inMemoryAccessToken

export const setInMemoryAccessToken = (token) => {
  inMemoryAccessToken = token || null
}

export const setAccessTokenGetter = (fn) => {
  getAccessTokenFn = fn
}

// 1. INTERCEPTOR DE REQUISIÇÃO (Envia o Token automaticamente)
api.interceptors.request.use(
  (config) => {
    const token =
      inMemoryAccessToken || (getAccessTokenFn ? getAccessTokenFn() : null)
    const isAuthEndpoint =
      config.url?.includes("api/token/") ||
      config.url?.includes("api/register/")

    // Não envia Authorization antigo em rotas públicas de login/refresh/registro
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 2. INTERCEPTOR DE RESPOSTA (Renova token via cookie HttpOnly se expirar)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response && error.response.status === 401 && originalRequest) {
      const currentPath = window.location.pathname
      const isPublicAuthPage =
        currentPath === "/" ||
        currentPath.includes("/login") ||
        currentPath.includes("/register")
      const isRefreshRequest =
        originalRequest.url?.includes("api/token/refresh/")

      if (!isPublicAuthPage && !isRefreshRequest) {
        const isTokenError =
          error.response.data && error.response.data.code === "token_not_valid"

        if (isTokenError && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshResponse = await api.post("api/token/refresh/")
            const newAccess = refreshResponse.data.access

            // Atualiza imediatamente em memória antes de refazer a requisição
            setInMemoryAccessToken(newAccess)

            window.dispatchEvent(
              new CustomEvent("tokenRefreshed", {
                detail: { accessToken: newAccess },
              }),
            )

            originalRequest.headers.Authorization = `Bearer ${newAccess}`
            return api(originalRequest)
          } catch (refreshError) {
            setInMemoryAccessToken(null)
            localStorage.clear()
            window.location.href = "/?expired=true"
            return Promise.reject(refreshError)
          }
        }

        if (isTokenError) {
          setInMemoryAccessToken(null)
          localStorage.clear()
          window.location.href = "/?expired=true"
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
