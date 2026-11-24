# Redesign e validação

A revisão substitui o fluxo anterior por preparação do treino, registro de séries, descanso, sequência e conclusão explícita. A biblioteca mostra cartões resumidos; histórico, evolução e marcas ficam em Progresso. O construtor ganhou busca, filtro por grupo e organização da sequência. O código continua usando o estado, os IDs e os mecanismos de persistência existentes.

## Evidências de paridade

- PASS: navegação e preparação; criação e organização de rotina; histórico expansível; execução com carga, repetições e tempo, edição e exclusão de séries, mais de três séries e confirmação de conclusão, em navegador com dados isolados.
- PASS: retomada após recarregar, descanso pausado, rascunhos, carga zero e gravação única; teste automatizado `node tests/domain-regression.cjs` verifica também estado desconhecido e exportação/restauração JSON.
- PASS: páginas inicial e execução inspecionadas em desktop e celular simulado; larguras de 360, 390, 430, 768, 1280 e 1440 verificadas sem overflow horizontal na página inicial. Tema claro e escuro inspecionados.
- PASS: sintaxe JavaScript, IDs estáticos únicos e `git diff --check`.
- NÃO VERIFICADO: login Google real, sincronização e resolução de conflitos no Supabase, reprodução e autenticação Spotify, teclado virtual do Safari no iPhone, tamanhos e estados não exercitados. As integrações foram preservadas, mas não foram conectadas a contas reais durante os testes.
- NÃO VERIFICADO: todos os casos da lista de paridade original, incluindo cada combinação de importação, edição e exclusão de histórico e cada preferência visual. Uma inspeção visual não confirma por si só todos os comportamentos.

A lista detalhada de referência está em `/workspace/dabliu-fit-handoff/FEATURE_PARITY_CHECKLIST.md`. A publicação na main foi solicitada posteriormente pelo usuário.
