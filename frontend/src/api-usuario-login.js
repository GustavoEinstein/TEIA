// Legacy interceptor - mantido para compatibilidade mas não usado pelo novo AuthContext
// O novo sistema usa api.js com AuthContext para gerenciamento de tokens seguro

// Não faz nada - o tratamento de 401 é feito em:
// 1. services/api.js (interceptor do axios customizado)
// 2. context/AuthContext.jsx (gerenciamento de estado de auth)
// 3. components/PrivateRoute.jsx (validação server-side)

console.log('[TEIA] Legacy api-usuario-login.js loaded - interceptors handled by AuthContext/api.js');