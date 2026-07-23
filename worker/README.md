# eCarsTrade Gemini Worker

```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put APP_SHARED_TOKEN
npx wrangler deploy
```

Set `VITE_GEMINI_REVIEW_ENDPOINT` to the deployed `/gemini-review` URL when building the Pages app. The key is never sent to the browser.
