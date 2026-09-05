# Renovação de sessão

Depende da API /auth/refresh e /auth/logout com cookie HttpOnly. Publicar a API primeiro, após sua migração SQL. Na Vercel, remover VITE_API_URL absoluto ou definir VITE_API_URL=/api. O proxy em vercel.json mantém o cookie no domínio do frontend; cookies de terceiros não são necessários. Em desenvolvimento Vite faz proxy para localhost:8080; configurar AUTH_COOKIE_SECURE=false no backend local. Origin do frontend deve estar na lista CORS do backend.

Access token expirado: renovar silenciosamente, repetir a requisição uma vez. Refresh expirado: remover auth e navegar para /login. 403 não encerra a sessão. Erro de rede/503 permite tentar novamente sem apagar credenciais. Ao abrir uma rota privada com token expirado, aguardar renovação antes de carregar o painel. Logout revoga o cookie no servidor. Web Locks serializa renovação entre abas em navegadores compatíveis; Promise compartilhada serializa dentro de uma aba.

Testes: npx vitest run. Build: npm run build. Validar no preview autorizado o cookie Secure/HttpOnly, renovação e logout, pois o proxy externo da Vercel não é exercitado pelos testes locais. Sem alterações em worker/cron.
