import axios from "axios"

// Fallback para desenvolvimento se VITE_API_URL não estiver definido
const getApiBaseUrl = () => {
  // Vite expõe variáveis com prefixo VITE_ em import.meta.env
  // Em desenvolvimento, fallback para localhost:8000
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/'
}

// Cria uma instância padrão do Axios
// withCredentials: true é OBRIGATÓRIO para enviar/receber cookies HttpOnly
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,  // Envia cookies (refresh_token HttpOnly) automaticamente
})

// Referência para função que obtém o access token (será definida pelo AuthProvider)
// Inicializa como null - o AuthContext injeta o getter real após montar
let getAccessTokenFn = () => null

/**
 * Define a função para obter o access token.
 * Chamada pelo AuthProvider na inicialização.
 * @param {Function} fn - Função que retorna o access token atual
 */
export const setAccessTokenGetter = (fn) => {
  getAccessTokenFn = fn
}

// 1. INTERCEPTOR DE REQUISIÇÃO (Envia o access_token no header Authorization)
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

// 2. INTERCEPTOR DE RESPOSTA (Trata erro 401 - token expirado)
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
        const isTokenError =
          error.response.data && error.response.data.code === "token_not_valid"

        // Se o erro foi por token inválido e ainda não tentamos renovar
        if (isTokenError && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Refresh via cookie HttpOnly - NÃO enviamos refresh no body
            // O cookie é enviado automaticamente graças a withCredentials: true
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}api/token/refresh/`,
              {},  // Body vazio - refresh_token vem do cookie
              { withCredentials: true }
            )

            const newAccessToken = refreshResponse.data.access

            // Notificamos o AuthContext para atualizar seu estado em memória
            window.dispatchEvent(new CustomEvent('tokenRefreshed', {
              detail: { accessToken: newAccessToken }
            }))

            // Refaz a requisição original com o novo token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return api(originalRequest)
          } catch (refreshError) {
            // Se o refresh falhar (cookie expirado/inválido), sessão morreu
            // Não há localStorage para limpar - cookie é HttpOnly
            window.location.href = "/?expired=true"
            return Promise.reject(refreshError)
          }
        }

        // Se já tentou renovar ou token inválido
        if (isTokenError) {
          window.location.href = "/?expired=true"
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api