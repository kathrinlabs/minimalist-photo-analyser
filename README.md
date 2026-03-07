# Minimalist Photo Analyser

AI-powered photo composition feedback based on the principles of *The Art of Minimalist Photo Composition* by Kathrin Federer.

## Deployment on Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and click **Add new site → Import an existing project**
2. Connect your GitHub repository
3. Build settings are auto-detected from `netlify.toml` — no changes needed

### 3. Set the Environment Variable

In the Netlify dashboard:

**Site settings → Environment variables → Add a variable**

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic API key) |

### 4. Deploy

Trigger a new deploy from the Netlify dashboard or push a new commit. The site will be live at your Netlify URL.

## Project Structure

```
minimalist-photo-analyser/
├── index.html                    # Frontend (single HTML file)
├── netlify.toml                  # Netlify build & function config
├── package.json                  # Root dependencies
├── .gitignore
├── README.md
└── netlify/
    └── functions/
        ├── analyse.js            # Serverless function (API proxy)
        └── package.json          # Function dependencies
```

## How it works

1. User uploads a photo and selects analysis mode (Lightroom edit or Photoshop composite)
2. The frontend resizes the image to max 1600px and sends it as base64 to `/.netlify/functions/analyse`
3. The serverless function reads `ANTHROPIC_API_KEY` from the environment (never exposed to the browser) and calls the Anthropic Claude API
4. The analysis is returned and rendered as structured cards in the UI

## Models used

- **claude-sonnet-4-5** — Anthropic's multimodal vision model
