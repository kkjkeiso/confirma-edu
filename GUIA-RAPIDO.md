# Guia Rápido — ConfirmaEdu

Este guia configura o projeto do zero. Leva uns 5 minutos e você só precisa fazer isso **uma vez**.

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (ou faça login).
2. Clique em **New Project**, escolha uma organização, defina um nome (ex: `confirma-edu`) e uma senha para o banco.
3. Aguarde o projeto terminar de ser provisionado (leva cerca de 1-2 minutos).

## 2. Executar o banco de dados

1. No painel do projeto, abra **SQL Editor** (menu lateral).
2. Clique em **New query**.
3. Copie todo o conteúdo do arquivo [`database.sql`](./database.sql) deste repositório e cole no editor.
4. Clique em **Run**. O script cria as tabelas, funções, políticas de segurança (RLS) e o bucket de armazenamento das justificativas — tudo de uma vez.

## 3. Desativar a confirmação de e-mail

Por padrão, o Supabase exige que o usuário confirme o e-mail antes de logar. Como o ConfirmaEdu usa matrícula (não e-mail real) para login, isso precisa ser desativado:

1. Vá em **Authentication → Sign In / Providers → Email**.
2. Desmarque a opção **Confirm email**.
3. Salve.

## 4. Preencher o `config.js`

1. No painel do Supabase, vá em **Project Settings → Data API** (ou **API**).
2. Copie a **Project URL** e cole em `SUPABASE_URL` no arquivo [`config.js`](./config.js).
3. Copie a chave **anon / public** (ou **publishable key**) e cole em `SUPABASE_KEY`.

```js
window.CONFIRMAEDU_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_KEY: "sua-chave-publica-aqui",
};
```

> Essa chave é pública (feita para rodar no navegador). A segurança real fica nas políticas de RLS criadas pelo `database.sql`.

## 5. Abrir o sistema e virar o primeiro usuário da direção

1. Abra o `index.html` (ou publique o site) e cadastre-se escolhendo o perfil **Direção**.
2. Seu cadastro ficará como **pendente** — isso é esperado.
3. Saia e entre novamente com a mesma conta: o sistema reconhece que ainda não existe nenhuma direção cadastrada e libera seu acesso automaticamente (bootstrap do primeiro administrador).
4. A partir daí, use o próprio painel **Controle de acesso** para aprovar os próximos cadastros de cantina e direção.

Pronto — depois desses passos, essa tela de configuração não aparece mais.
