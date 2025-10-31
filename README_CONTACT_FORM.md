# Configuração do Formulário de Contacto DIGISOL

Este documento explica como configurar o formulário de contacto para enviar emails para m.f.g.digisol@gmail.com usando o serviço EmailJS.

## Passos para Configuração

### 1. Criar uma conta no EmailJS

1. Acesse [EmailJS](https://www.emailjs.com/) e crie uma conta gratuita
2. Faça login na sua conta

### 2. Adicionar um serviço de email

1. No dashboard do EmailJS, clique em "Email Services" no menu lateral
2. Clique em "Add New Service"
3. Escolha um provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta m.f.g.digisol@gmail.com
5. Dê um nome ao serviço (ex: "digisol_email")
6. Anote o Service ID (você precisará dele mais tarde)

### 3. Criar um template de email

1. No dashboard do EmailJS, clique em "Email Templates" no menu lateral
2. Clique em "Create New Template"
3. Configure o template com os seguintes campos:
   - **To Email**: {{to_email}}
   - **From Name**: {{from_name}}
   - **From Email**: {{from_email}}
   - **Subject**: Novo contacto do website DIGISOL
   - **Content**: Personalize o conteúdo conforme necessário, usando as variáveis:
     - {{from_name}} - Nome do remetente
     - {{from_email}} - Email do remetente
     - {{phone}} - Telefone
     - {{company}} - Empresa
     - {{service}} - Serviço de interesse
     - {{message}} - Mensagem

4. Anote o Template ID (você precisará dele mais tarde)

### 4. Atualizar o código do website

1. Abra o arquivo `/Users/josemiguelferrazguedes/Projects/digisol-web/html/contact.html`
2. Localize a seguinte linha:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   ```
3. Substitua "YOUR_PUBLIC_KEY" pela sua Public Key do EmailJS (encontrada em Account > API Keys)

4. Abra o arquivo `/Users/josemiguelferrazguedes/Projects/digisol-web/html/js/main.js`
5. Localize a seguinte linha:
   ```javascript
   emailjs.send('service_id', 'template_id', templateParams)
   ```
6. Substitua 'service_id' pelo Service ID que você anotou anteriormente
7. Substitua 'template_id' pelo Template ID que você anotou anteriormente

## Limitações do Plano Gratuito

O plano gratuito do EmailJS permite:
- 200 emails por mês
- Sem anexos de arquivos

Se você precisar de mais emails ou suporte para anexos, considere fazer upgrade para um plano pago.

## Teste

Após configurar tudo, teste o formulário enviando uma mensagem de teste para garantir que tudo está funcionando corretamente.
