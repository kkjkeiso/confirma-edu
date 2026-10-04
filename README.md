# ConfirmaEdu

**Versão em português (oficial).** Em caso de divergência entre esta versão e a tradução em inglês abaixo, prevalece o texto em português.

O ConfirmaEdu é o sistema de controle de refeições da Escola Estadual Professor Antônio Dantas (EEPAD), em Natal/RN. O aluno confirma todo dia se vai almoçar e, na hora da refeição, registra a própria presença apontando a câmera do celular para um QR Code gerado pela cantina — a cantina também pode registrar manualmente pela matrícula, para quem não tem como escanear. A direção acompanha em tempo real quem confirmou e não apareceu, analisa as justificativas de falta enviadas em PDF pelos alunos e libera o acesso de novos funcionários da cantina e da própria direção. A cantina e a direção também mantêm o cardápio da semana, visível para todo mundo. O cadastro é feito só com matrícula (sem precisar de e-mail de verdade), a primeira pessoa a se cadastrar como direção assume automaticamente esse papel no sistema, e todas as telas têm tema claro e escuro.

Tudo é HTML, CSS e JavaScript puros, sem framework e sem etapa de build — o `index.html` na raiz é o único ponto de entrada, e todo o front-end vive em `frontend/`: os estilos em `frontend/css/`, divididos por responsabilidade (tokens e componentes compartilhados, telas de login, telas internas e regras responsivas), e a lógica do app em `frontend/js/`, dividida em módulos pequenos (estado, utilitários, telas por papel, modais, leitor de QR Code, dados e eventos) carregados em sequência — sem bundler, só `<script defer>`. O backend é o Supabase: Postgres com Row Level Security para cada papel (aluno, cantina, direção), autenticação, Realtime para atualizar os painéis sozinhos quando alguém confirma uma refeição ou registra presença, e Storage para os PDFs de justificativa. Todo o schema do banco — tabelas, funções, políticas de segurança e o bucket de arquivos — está em `backend/database.sql`, pensado para ser colado de uma vez no SQL Editor do Supabase. As bibliotecas de QR Code (geração e leitura pela câmera) e o cliente do Supabase ficam vendorizadas localmente em `frontend/js/vendor/` em vez de carregadas por CDN, então o projeto inteiro funciona abrindo os arquivos direto, sem build e sem instalar nada.

```
.
├── index.html                       Ponto de entrada — carrega o app
├── backend/
│   └── database.sql                 Schema completo do Supabase (tabelas, RLS, functions, storage)
├── frontend/
│   ├── assets/
│   │   ├── logo.webp                Logo do ConfirmaEdu
│   │   └── brasao-escola.webp       Brasão da Escola Estadual Professor Antônio Dantas
│   ├── css/
│   │   ├── global.css               Tokens de tema, reset e componentes compartilhados por todo o app
│   │   ├── auth.css                 Telas de login, cadastro e aprovação pendente
│   │   ├── dashboard.css            Painéis do aluno, da cantina e da direção
│   │   └── responsive.css           Breakpoints, impressão e redução de movimento
│   └── js/
│       ├── vendor/
│       │   ├── supabase.js          Cliente oficial do Supabase
│       │   ├── qrcode.js            Geração do QR Code do dia
│       │   └── jsQR.js              Leitura do QR Code pela câmera
│       ├── config.js                Credenciais do Supabase (URL e chave pública)
│       ├── state.js                 Constantes, estado da UI e dos dados
│       ├── utils.js                 Formatação de datas, textos e identificadores
│       ├── shared.js                Render raiz e componentes reaproveitados entre papéis
│       ├── auth-views.js            Telas de login, cadastro e aprovação pendente
│       ├── student-views.js         Painel do aluno
│       ├── canteen-views.js         Painel da cantina
│       ├── direction-views.js       Painel da direção
│       ├── modals.js                Justificativa, cardápio e visualização de documentos
│       ├── qr-scanner.js            Leitura do QR Code pela câmera do aluno
│       ├── data.js                  Carregamento, atualização e tempo real com o Supabase
│       ├── events.js                Cliques, envios de formulário e atalhos de teclado
│       └── main.js                  Inicialização do app
├── LICENSE.md                       Licença proprietária (português prevalece, com tradução em inglês)
└── README.md
```

## Como ligar

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your project** (canto superior direito).
2. Crie sua conta — pode ser com GitHub, Google ou e-mail e senha. Se usar e-mail, confirme pelo link que chegar na sua caixa de entrada.
3. Na primeira vez, o Supabase pede para criar uma **organização**: dê qualquer nome (ex.: o seu nome ou "ConfirmaEdu"), deixe o tipo como **Personal** e o plano como **Free**, e clique em **Create organization**.
4. Clique em **New project**. Preencha:
   - **Project name**: qualquer nome, ex. `confirma-edu`.
   - **Database Password**: gere uma senha forte (o próprio Supabase tem um botão **Generate a password**) e guarde em um lugar seguro — ela não é usada neste projeto, mas o Supabase exige.
   - **Region**: escolha a mais próxima (ex. `South America (São Paulo)`).
   Clique em **Create new project** e aguarde cerca de 1-2 minutos enquanto ele é provisionado.
5. Com o projeto pronto, no menu lateral esquerdo clique no ícone de banco de dados **SQL Editor**. Clique em **New query**, abra o arquivo `backend/database.sql` deste repositório, copie todo o conteúdo, cole no editor e clique em **Run** (ou `Ctrl+Enter`). Isso cria todas as tabelas, funções, políticas de RLS e o bucket de justificativas de uma vez só. Se aparecer "Success. No rows returned", deu certo.
6. Ainda no menu lateral, clique no ícone de cadeado **Authentication**. Na aba **Sign In / Providers**, clique em **Email** para expandir as opções e desmarque **Confirm email**. Clique em **Save** no final do painel — o login deste sistema é por matrícula, não por e-mail real, então essa confirmação precisa ficar desligada.
7. No menu lateral, clique no ícone de engrenagem **Project Settings** (geralmente no fim da lista) e depois em **Data API**. Nessa página você vai ver:
   - **Project URL**: copie esse valor inteiro (começa com `https://` e termina em `.supabase.co`).
   - Mais abaixo, a seção **Project API Keys**: copie a chave marcada como **anon** / **public** (ou **publishable**, nas contas mais novas do Supabase — começa com `sb_publishable_`).
8. Abra o arquivo `frontend/js/config.js` deste repositório e cole os dois valores:
   ```js
   window.CONFIRMAEDU_CONFIG = {
     SUPABASE_URL: "https://seu-projeto.supabase.co",
     SUPABASE_KEY: "sua-chave-publica-aqui",
   };
   ```
9. Abra o `index.html` (duplo clique nele, ou publique os arquivos em qualquer host estático) e cadastre-se escolhendo o perfil **Direção**. Como ainda não existe nenhuma direção cadastrada, o próprio sistema libera esse primeiro acesso automaticamente. A partir daí, use o painel **Acessos** para aprovar a cantina e os próximos funcionários.

Essa chave do Supabase é pública por natureza, feita para rodar no navegador — a segurança de verdade está nas políticas de RLS criadas pelo `backend/database.sql`.

O código foi desenvolvido por Maria Isabel da Costa Paiva, Monalysa Emilly Caetano e Patrickson Adriel da Silva Moura Freitas, exclusivamente para a Escola Estadual Professor Antônio Dantas, e é proprietário — os termos completos estão em `LICENSE.md`. Na prática, o código-fonte pode ser visualizado para fins de estudo, mas nenhuma parte dele (código, textos, imagens ou identidade visual) pode ser copiada, redistribuída ou reutilizada sem autorização prévia por escrito.

---

# ConfirmaEdu

**English version (translation for convenience only).** In case of any discrepancy between this translation and the Portuguese version above, the Portuguese text prevails.

ConfirmaEdu is the meal-control system of Escola Estadual Professor Antônio Dantas (EEPAD), a public school in Natal, Brazil. Every day, students confirm whether they will have lunch, and at mealtime they check themselves in by pointing their phone's camera at a QR Code generated by the canteen — the canteen staff can also check a student in manually by registration number, for anyone who cannot scan. The school's direction tracks in real time who confirmed but never showed up, reviews the absence justifications students upload as PDFs, and approves access for new canteen and direction staff. The canteen and direction also keep the weekly menu up to date, visible to everyone. Sign-up only needs a registration number (no real e-mail required), the first person to sign up as direction automatically becomes the school's administrator in the system, and every screen has a light and a dark theme.

Everything is plain HTML, CSS and JavaScript, with no framework and no build step — the root `index.html` is the single entry point, and the whole front-end lives under `frontend/`: styles in `frontend/css/`, split by responsibility (tokens and shared components, auth screens, dashboard screens and responsive rules), and the app logic in `frontend/js/`, split into small modules (state, utilities, per-role screens, modals, QR reader, data and events) loaded in sequence — no bundler, just `<script defer>`. The backend is Supabase: Postgres with Row Level Security per role (student, canteen, direction), authentication, Realtime to refresh the dashboards on their own whenever someone confirms a meal or checks in, and Storage for the justification PDFs. The whole database schema — tables, functions, security policies and the storage bucket — lives in `backend/database.sql`, meant to be pasted at once into Supabase's SQL Editor. The QR Code libraries (generating and reading via the camera) and the Supabase client are vendored locally under `frontend/js/vendor/` instead of loaded from a CDN, so the whole project runs by opening the files directly, with no build and nothing to install.

```
.
├── index.html                       Entry point — loads the app
├── backend/
│   └── database.sql                 Full Supabase schema (tables, RLS, functions, storage)
├── frontend/
│   ├── assets/
│   │   ├── logo.webp                ConfirmaEdu logo
│   │   └── brasao-escola.webp       Escola Estadual Professor Antônio Dantas crest
│   ├── css/
│   │   ├── global.css               Theme tokens, reset and components shared across the app
│   │   ├── auth.css                 Login, sign-up and pending-approval screens
│   │   ├── dashboard.css            Student, canteen and direction dashboards
│   │   └── responsive.css           Breakpoints, print and reduced-motion rules
│   └── js/
│       ├── vendor/
│       │   ├── supabase.js          Official Supabase client
│       │   ├── qrcode.js            Generates the day's QR Code
│       │   └── jsQR.js              Reads the QR Code via the camera
│       ├── config.js                Supabase credentials (URL and public key)
│       ├── state.js                 Constants, UI state and data state
│       ├── utils.js                 Date, text and identifier formatting
│       ├── shared.js                Root render and components reused across roles
│       ├── auth-views.js            Login, sign-up and pending-approval screens
│       ├── student-views.js         Student dashboard
│       ├── canteen-views.js         Canteen dashboard
│       ├── direction-views.js       Direction dashboard
│       ├── modals.js                Justification, menu editing and document preview
│       ├── qr-scanner.js            Reads the QR Code via the student's camera
│       ├── data.js                  Loading, refreshing and realtime sync with Supabase
│       ├── events.js                Clicks, form submits and keyboard shortcuts
│       └── main.js                  App bootstrap
├── LICENSE.md                       Proprietary license (Portuguese prevails, English translation)
└── README.md
```

## Getting it running

1. Go to [supabase.com](https://supabase.com) and click **Start your project** (top right corner).
2. Create an account — with GitHub, Google, or email and password. If you use email, confirm it through the link sent to your inbox.
3. The first time, Supabase asks you to create an **organization**: give it any name (e.g. your own name or "ConfirmaEdu"), leave the type as **Personal** and the plan as **Free**, then click **Create organization**.
4. Click **New project**. Fill in:
   - **Project name**: any name, e.g. `confirma-edu`.
   - **Database Password**: generate a strong password (there's a **Generate a password** button) and keep it somewhere safe — it isn't used by this project, but Supabase requires one.
   - **Region**: pick the closest one to you.
   Click **Create new project** and wait about 1-2 minutes while it's provisioned.
5. Once the project is ready, click the database icon **SQL Editor** in the left sidebar. Click **New query**, open the `backend/database.sql` file from this repository, copy its entire contents, paste it into the editor, and click **Run** (or `Ctrl+Enter`). This creates every table, function, RLS policy and the justifications storage bucket in one shot. "Success. No rows returned" means it worked.
6. Still in the left sidebar, click the lock icon **Authentication**. Under the **Sign In / Providers** tab, click **Email** to expand its options and uncheck **Confirm email**. Click **Save** at the bottom of the panel — login in this system uses a registration number, not a real email address, so this confirmation step needs to stay off.
7. In the left sidebar, click the gear icon **Project Settings** (usually near the bottom of the list), then **Data API**. On that page you'll find:
   - **Project URL**: copy the full value (starts with `https://` and ends in `.supabase.co`).
   - Further down, the **Project API Keys** section: copy the key labeled **anon** / **public** (or **publishable** on newer Supabase accounts — it starts with `sb_publishable_`).
8. Open this repository's `frontend/js/config.js` file and paste both values in:
   ```js
   window.CONFIRMAEDU_CONFIG = {
     SUPABASE_URL: "https://your-project.supabase.co",
     SUPABASE_KEY: "your-public-key-here",
   };
   ```
9. Open `index.html` (double-click it, or publish the files on any static host) and sign up choosing the **Direção** (direction) role. Since no direction account exists yet, the system grants that first access automatically. From there, use the **Acessos** (access) panel to approve the canteen and the next staff accounts.

That Supabase key is public by design, meant to run in the browser — the real security lives in the RLS policies created by `backend/database.sql`.

The code was developed by Maria Isabel da Costa Paiva, Monalysa Emilly Caetano and Patrickson Adriel da Silva Moura Freitas, exclusively for Escola Estadual Professor Antônio Dantas, and is proprietary — the full terms are in `LICENSE.md`. In practice, the source can be viewed for study purposes, but no part of it (code, texts, images or visual identity) may be copied, redistributed or reused without prior written permission.
