# Discord Bot with Cloudflare AI

[👉 Demo](https://discord.com/oauth2/authorize?client_id=1227951760539258880&permissions=0&scope=bot)

## Fork, Clone, Install, Dev

[Fork and Clone](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)

```sh
cd discord-bot-cloudflare-ai-challenge
npm i
npm run dev
```

## Set Environment Variables

Create a New Application from [Dashboard](https://discord.com/developers/applications).  
Copy your `APPLICATION ID`, `PUBLIC KEY` and `TOKEN`, and put them `.dev.vars` file.

Storing secrets.

```shell
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_TOKEN
```

## Register Commands and Deploy

```shell
npm run register
npm run deploy
```

## Set Endpoint URL

Enter `https://discord-hono-example.YOUER_DOMAIN.workers.dev` in the [INTERACTIONS ENDPOINT URL](https://discord.com/developers/applications).

## Test Bot

Create an invite URL from the [Dashboard](https://discord.com/developers/applications).  
`YOUR_APP` > `OAuth2` tab > `OAuth2 URL Generator` > Check SCOPES: `bot` > URL `Copy`  
Paste the URL into the browser.

Post `/hello` on the invited server.
