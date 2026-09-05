# Confirmação de agendamento

Depende da PR backend de idempotência para garantia persistente. A trava visual pode ser publicada antes, mas a garantia completa exige o backend e a migração 002 no Supabase.

Cliente e admin têm trava síncrona contra duplo clique, botão desabilitado com texto de carregamento e campos bloqueados enquanto a requisição está em andamento. A API recebe Idempotency-Key por tentativa. A chave permanece em sessionStorage após falhas ou recarga, isolada por usuário e tipo de fluxo; mudança de payload cria outra chave. Sucesso de reserva presencial limpa a chave. Timeout de pagamento depois da reserva orienta consultar Meus agendamentos, sem cancelar automaticamente uma reserva cujo pagamento pode ter sido criado.

Testes: npm test e npm run build. Aceite: dois submits no mesmo ciclo disparam somente uma operação; falha libera a interface; retry mantém chave; usuários diferentes não compartilham chave; botão permanece ocupado também durante espera pelo WAHA. A PR não inclui alterações de sessão nem cron.
