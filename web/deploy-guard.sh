set -e
npx @cloudflare/next-on-pages@latest
npx wrangler pages deploy .vercel/output/static --project-name skynerd-ui --branch ui-v2 --commit-dirty=true
curl -sS "https://skynerd-ui.pages.dev" | grep -q "Node.JS Compatibility Error" && { echo "❌ compat error"; exit 1; }
curl -sS "https://skynerd.io" | grep -q "Node.JS Compatibility Error" && { echo "❌ compat error on custom domain"; exit 1; }
echo "✅ deploy healthy"
