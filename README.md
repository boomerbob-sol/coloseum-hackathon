# Coloseum Hackathon

A monorepo of three Cloudflare Workers (“Bob” apps) plus n8n workflows, powering:

- **Boomer FM** – Radioking widget proxy  
- **Boomerverse Lore** – Interactive lore site  
- **ContentBob** – Meme / engage / profile image generator  

---

## Repo Structure

/
├── boomer-fm/ # Worker for streaming radio widget
│ ├── worker.js
│ └── wrangler.toml
│
├── boomerverse-lore/ # Worker serving lore site UI + Cloudinary backstory images
│ ├── worker.js
│ └── wrangler.toml
│
├── content-bob/ # Worker serving Toast UI editor overlay & image API
│ ├── worker.js
│ └── wrangler.toml
│
├── n8n-workflows/ # JSON exports of any n8n flows you use
│ └── boomerbob-agent.workflow.json
│
├── .env # local template (ignored in git)
├── .gitignore
└── README.md

yaml
Copy
Edit

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)  
- [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/) (`npm install -g wrangler`)  
- A [Cloudflare account](https://dash.cloudflare.com) with Workers enabled  

---

## Getting Started

1. **Clone**  
   ```bash
   git clone https://github.com/your-org/coloseum-hackathon.git
   cd coloseum-hackathon
Install Wrangler (if you haven’t already)

bash
Copy
Edit
npm install -g wrangler
Configure secrets
We store all API keys & tokens in Cloudflare’s dashboard or via wrangler secret so they never live in git:

bash
Copy
Edit
# from repo root:
wrangler secret put TELEGRAM_TOKEN       --env production --path boomerverse-lore
wrangler secret put CLOUDINARY_API_KEY   --env production --path boomerverse-lore
wrangler secret put CLOUDINARY_API_SECRET--env production --path boomerverse-lore

wrangler secret put CONTENTBOB_CLOUDINARY_API_KEY    --env production --path content-bob
wrangler secret put CONTENTBOB_CLOUDINARY_API_SECRET --env production --path content-bob
Or in the dashboard:
Workers & Pages → your Worker → Settings → Variables and Secrets.

Deploying Workers
Each app has its own wrangler.toml. The minimal pattern:

toml
Copy
Edit
name = "your-worker-name"
main = "worker.js"
type = "javascript"

account_id       = "<YOUR_ACCOUNT_ID>"
workers_dev      = true
compatibility_date = "2025-05-17"

[env.production]
# if using a custom domain:
# route  = "subdomain.yourdomain.com/*"
# zone_id = "<YOUR_ZONE_ID_FROM_CF>"
From the project folder (e.g. boomerverse-lore/):

bash
Copy
Edit
# test locally
wrangler dev --local

# publish to workers.dev
wrangler publish --env production
Repeat for each of:

boomer-fm/

boomerverse-lore/

content-bob/

n8n Workflows
We store any n8n flow exports under n8n-workflows/.
To import:

Spin up n8n (Docker or local).

In the UI: Import > Workflow JSON.

Enable credentials and adjust any API tokens via n8n’s own Credentials screen.

.gitignore
We ignore:

All log files

node_modules/, build outputs

Local .env* files

Any editor/IDE caches

You don’t need to change this—your secrets are never committed.

🎯 Next Steps
Add CI (GitHub Actions)

Hook up custom domains & routes

Expand lore content & image tags

Build additional automations
