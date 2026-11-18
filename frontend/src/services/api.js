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
  if (envUrl.startsWith("/")) return envUrl // URL relativa (ex: "/api/") - produção Docker
  return envUrl // URL absoluta (ex: "http://localhost:8000/") - desenvolvimento
}

// Cria uma instância padrão do Axios
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Habilita envio de cookies HttpOnly cross-origin (localhost:5173 → localhost:8000)
})

// Referência para função que obtém o access token (será definida pelo AuthProvider)
let getAccessTokenFn = () => localStorage.getItem("access_token")

/**
 * Define a função para obter o access token.
 * Chamada pelo AuthProvider na inicialização.
 * @param {Function} fn - Função que retorna o access token atual
 */
export const setAccessTokenGetter = (fn) => {
  getAccessTokenFn = fn
}

// 1. INTERCEPTOR DE REQUISIÇÃO (Envia o Token automaticamente)
api.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFn()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 2. INTERCEPTOR DE RESPOSTA (Trata o erro 401 de forma inteligente)
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname

      // Só atua se NÃO estivermos na tela de login ou registro
      if (currentPath !== "/" && !currentPath.includes("/register")) {
        // Verifica se é realmente um erro de token expirado vindo do SimpleJWT
        // Isso evita que falsos 401 (como erros de CORS ou redirects sem barra) desloguem você
        const isTokenError =
          error.response.data && error.response.data.code === "token_not_valid"

        // Se o erro foi por token inválido e ainda não tentamos renovar
        if (isTokenError && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Backend lê refresh_token do cookie HttpOnly (path=/api/token/refresh/)
            // Não precisamos enviar no body - withCredentials: true envia o cookie automaticamente
            const refreshResponse = await api.post("api/token/refresh/")

            // Sucesso! O novo access token será obtido via getAccessTokenFn na próxima request
            // Notificamos o AuthContext para atualizar seu estado
            window.dispatchEvent(
              new CustomEvent("tokenRefreshed", {
                detail: { accessToken: refreshResponse.data.access },
              }),
            )

            // Refaz a requisição original que havia falhado com o novo token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`
            return api(originalRequest)
          } catch (refreshError) {
            // Se o refresh_token também falhar, aí sim a sessão morreu de verdade
            localStorage.clear()
            window.location.href = "/?expired=true"
            return Promise.reject(refreshError)
          }
        }

        // Se já tentou renovar, se não havia refresh token, ou se o token era inválido
        if (isTokenError) {
          localStorage.clear()
          window.location.href = "/?expired=true"
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
