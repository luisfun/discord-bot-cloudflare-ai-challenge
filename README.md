# Discord Bot with Cloudflare AI

[👉 Demo](https://discord.com/oauth2/authorize?client_id=1227951760539258880&permissions=0&scope=bot)

## Fork, Clone, Install, Dev

[Fork and Clone](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)

```sh
cd discord-bot-cloudflare-ai-challenge
npm i
npm run dev
```

## Setup AI Gateway

[Creat AI Gateway](https://developers.cloudflare.com/ai-gateway/get-started/creating-gateway/)

Get API Endpoint  
[`AI Gateway`](https://dash.cloudflare.com/?to=/:ai/ai-gateway/settings) > `AI Paint API Endpoint` > Select `Workers AI`

Set Caching and Rate-limiting  
[`AI Gateway`](https://dash.cloudflare.com/?to=/:ai/ai-gateway/settings)

[Creat API Token](https://dash.cloudflare.com/profile/api-tokens)  
Select template `Workers AI`

```shell
npx wrangler secret put Endpoint
npx wrangler secret put Token
```

## Setup Discord bot

Create a New Application from [Dashboard](https://discord.com/developers/applications).  
Copy your `APPLICATION ID`, `PUBLIC KEY` and `TOKEN`, and put them `.dev.vars` file.

Storing secrets.

```shell
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_TOKEN
```

Register commands and Deploy.

```shell
npm run register
npm run deploy
```

Enter `https://YOUER_PROJECT.YOUER_DOMAIN.workers.dev` in the [INTERACTIONS ENDPOINT URL](https://discord.com/developers/applications).

Create an invite URL from [Dashboard](https://discord.com/developers/applications).  
`YOUR_APP` > `OAuth2` tab > `OAuth2 URL Generator` > Check SCOPES: `bot` > URL `Copy`  
Paste the URL into the browser.
