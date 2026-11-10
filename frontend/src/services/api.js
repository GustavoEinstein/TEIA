import axios from "axios"

// Cria uma instância padrão do Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Sua URL base
})

// 1. INTERCEPTOR DE REQUISIÇÃO (Envia o Token automaticamente)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
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
            const refreshToken = localStorage.getItem("refresh_token")

            if (refreshToken) {
              // Tenta renovar o token silenciosamente no background
              const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}api/token/refresh/`,
                {
                  refresh: refreshToken,
                },
              )

              // Sucesso! Salva o novo token
              const newAccessToken = refreshResponse.data.access
              localStorage.setItem("access_token", newAccessToken)

              // Refaz a requisição original que havia falhado com o novo token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              return api(originalRequest)
            }
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
