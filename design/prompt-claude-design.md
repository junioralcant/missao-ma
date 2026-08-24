# Prompt para o Claude Design (/design)

Copie tudo abaixo da linha e cole no Claude Design.

---

Crie um design canvas para o sistema web **"Missão Maranhão"** — plataforma da organização Missão 14 (missao.org.br) que direciona pessoas para o grupo de WhatsApp da sua cidade no Maranhão. Use exatamente a identidade visual do site oficial, descrita abaixo. Idioma de toda a UI: português (Brasil).

## Identidade visual (extraída de missao.org.br)

- **Fundo:** escuro quase preto `#070D0C`; cards/superfícies um tom acima (ex. `#12181A`) com borda sutil `rgba(255,255,255,0.08)`.
- **Cor primária (marca):** dourado/âmbar — `#FBAC1E` para destaques, ícones e borda de foco dos inputs; `#EEBB00` para fundo de botões primários (texto preto sobre o dourado).
- **Texto:** primário branco `#FFFFFF`; secundário `#E0E0E0`; apagado/muted `#666666`.
- **Apoio pontual:** azul `#0099FF` somente para links discretos. Erros em vermelho sobre fundo escuro; sucesso pode usar o próprio dourado.
- **Tipografia (Google Fonts):** `Fjalla One` para títulos/display; `Barlow Condensed` para eyebrows e subtítulos (caixa alta, tracking largo); `Afacad` para corpo e componentes de UI; `Fragment Mono` para dados tabulares e labels técnicos (CPF, datas, links).
- **Formas:** botões primários em pílula (radius ~50px), fundo `#EEBB00`, texto preto em bold; botões secundários ghost com borda sutil. Inputs escuros com radius ~7px, texto `#E0E0E0`, borda discreta e **foco com borda `#FBAC1E`**.
- **Tom geral:** dark, alto contraste, títulos fortes e condensados, acentos dourados generosos, visual de movimento/campanha. Wordmark de topo: o nome **Missão Maranhão** (texto estilizado em Fjalla One, branco com "Maranhão" em dourado) — não reproduzir logo raster.

## Telas (um artboard por item)

### 1. Página pública — Cadastro (mobile 390×844)

- Topo centralizado: wordmark **Missão Maranhão**; eyebrow em Barlow Condensed "GRUPOS DE WHATSAPP"; título "Grupo de WhatsApp da sua cidade"; subtítulo em texto secundário "Informe seus dados, escolha a sua cidade e entre no grupo de WhatsApp da sua região."
- Card do formulário com os campos, nesta ordem:
  1. **Nome completo** — input de texto, label acima, placeholder "Seu nome completo".
  2. **CPF** — input numérico com máscara, placeholder "000.000.000-00" (valor renderizado em Fragment Mono).
  3. **Cidade** — campo de **busca com autocomplete** (combobox): input com placeholder "Digite o nome da sua cidade" e dropdown aberto mostrando até 8 sugestões (ex.: "São Luís", "São Bento", "São João Batista"…), item ativo com fundo dourado translúcido; incluir também o estado "Nenhuma cidade encontrada".
  4. **Checkbox de consentimento** com o texto "Autorizo o armazenamento do meu nome, CPF e cidade para controle de participação nos grupos de WhatsApp."
  5. **Botão primário** pílula dourada, largura total: "Entrar no grupo da minha cidade".
- Abaixo do card, nota pequena em muted: "Seus dados (nome, CPF e cidade) são armazenados apenas para controle de participação nos grupos."
- Variantes menores ao lado do artboard: (a) alerta de erro no topo do card ("CPF inválido. Confira os números digitados."); (b) estado de sucesso — alerta "Cadastro realizado! Estamos te redirecionando para o grupo…" + botão "Entrar no grupo do WhatsApp".

### 2. Página pública — Cadastro (desktop 1440×900)

Mesma tela do artboard 1 em desktop: card centralizado com ~560px de largura, mesmos campos e estados.

### 3. Admin — Login (desktop 1440×900)

- Eyebrow "ÁREA ADMINISTRATIVA", título "Entrar".
- Card estreito centralizado: input **Senha** (type password) + botão primário pílula "Entrar".
- Variante com alerta de erro "Senha inválida."

### 4. Admin — Painel (desktop 1440×1200)

- Header da página: título "Área administrativa" à esquerda; botão ghost "Sair" à direita.
- **Card "Grupo padrão":** texto explicativo em muted "Usado quando a cidade escolhida ainda não tem grupo próprio."; form inline com input **Link do grupo padrão** (placeholder "https://chat.whatsapp.com/…") + botões "Salvar" (primário pequeno) e "Remover" (ghost vermelho); incluir a nota do estado vazio "Nenhum grupo padrão configurado — cadastros só concluem em cidades com grupo próprio."
- **Card "Grupos por cidade":** form inline com o **mesmo componente de busca de cidade** da tela pública (label "Cidade (MA)", placeholder "Digite para buscar…", dropdown de sugestões) + input **Link do grupo** + botão "Cadastrar"; abaixo, tabela com colunas **Cidade | Link | Ações**, 3–4 linhas de exemplo, ações "Editar" (ghost) e "Remover" (ghost vermelho); uma linha em modo de edição inline do link com botões "Salvar"/"Cancelar"; estado vazio "Nenhum grupo cadastrado ainda."
- **Card "Cadastros (128)":** botão ghost "Exportar CSV" no topo direito do card; tabela com colunas **Nome | CPF | Cidade | Data** (CPF e data em Fragment Mono), 4–5 linhas de exemplo com dados fictícios; estado vazio "Nenhum cadastro recebido ainda."

## Regras

- Reutilizar os mesmos componentes entre telas (mesmo input, mesmo botão, mesmo combobox de cidade no público e no admin).
- Nada de dados reais: nomes e CPFs fictícios (ex. "Maria dos Santos", "123.456.789-09").
- Não copiar textos, fotos ou logotipo raster do site missao.org.br — apenas a linguagem visual (cores, tipografia, formas) descrita acima.
