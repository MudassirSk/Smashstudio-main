# AMB Delights — Setup & Client Handoff

This site now has two layers:
- **The design** (`index.html` + CSS) — you edit this, rarely.
- **The content** (`content/*.json`) — the client edits this, often, through a visual editor at `/admin` instead of touching code.

Follow these steps once, in order. It's a bit of setup up front, but every future client site reuses the same pattern.

## Part 1 — Put the project on GitHub

You said you want to manage clients in GitHub, so this replaces the "drag and drop" upload you did earlier with a proper Git-connected deployment (required for the CMS to work, since it commits changes back to the repo).

```bash
cd amb-delights
git init
git add .
git commit -m "Initial AMB Delights site"
```

Create a new repo on GitHub (e.g. `amb-delights`, or `smashstudio` if you're already grouping clients — see our earlier structure discussion), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Part 2 — Reconnect Cloudflare Pages to GitHub instead of direct upload

1. Cloudflare dashboard → **Workers & Pages** → your existing `amb-delights` project → **Settings**.
2. There's no direct "switch to Git" toggle for a project created via upload — the reliable path is to create a **new** Pages project connected to Git, then point your domain to it:
   - **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → select your repo.
   - **Build settings**: no build command needed, output directory = `/` (root). Cloudflare auto-detects the `functions/` folder and deploys it as Pages Functions.
   - Deploy. You'll get a new `.pages.dev` URL.
3. If you'd already attached a custom domain to the old project, move it to the new one under **Custom domains**.
4. Delete the old direct-upload project once the new one is live and confirmed working.

From now on: every `git push` to `main` auto-deploys. This is also what makes Decap CMS's commits go live automatically.

## Part 3 — Create a GitHub OAuth App (so Decap CMS can log the client in)

1. GitHub → your account **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Fill in:
   - **Application name**: `AMB Delights CMS` (anything descriptive)
   - **Homepage URL**: your Cloudflare Pages URL, e.g. `https://amb-delights.pages.dev`
   - **Authorization callback URL**: same URL, e.g. `https://amb-delights.pages.dev`
3. Register the app. GitHub shows a **Client ID** — copy it. Click **Generate a new client secret** — copy that too (you won't see it again).

## Part 4 — Add the OAuth credentials to Cloudflare

1. In your new Pages project → **Settings** → **Environment variables**.
2. Add two variables (for the **Production** environment):
   - `GITHUB_CLIENT_ID` → the Client ID from Part 3
   - `GITHUB_CLIENT_SECRET` → the Client secret from Part 3
3. Save, then trigger a redeploy (Cloudflare → **Deployments** → **Retry deployment**) so the functions pick up the new variables.

## Part 5 — Point the CMS config at your real repo and URL

Open `admin/config.yml` and replace:
- `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` → your actual repo, e.g. `smashstudio/amb-delights`
- `https://YOUR-SITE.pages.dev` → your actual Pages URL or custom domain (no trailing slash)

Commit and push this change.

## Part 6 — Test it yourself first

1. Visit `https://your-site.pages.dev/admin`.
2. Click **Login with GitHub**, authorize the OAuth app.
3. You should see three collections: **Contact & Hours**, **Menu**, **Gallery**.
4. Edit something small (e.g. a menu price), click **Publish**.
5. Check your GitHub repo — you should see a new commit from your GitHub account. Check the live site a minute later — the change should be there.

**Important:** because this uses the `github` backend directly (not an editorial workflow), publishing commits straight to `main` and goes live immediately — there's no draft/review step. That's the right tradeoff for a single trusted client editor; if you ever want a review step before changes go live, Decap supports an `editorial_workflow` mode that opens a pull request instead — worth adding once a client's team grows past one editor.

## Part 7 — Hand off to the client

What the client needs from you:
1. **A GitHub account** (free) — either create one for them, or have them make one. They need to be a **collaborator** on the repo (GitHub → repo → **Settings** → **Collaborators** → add them) so the OAuth login works.
2. **The admin URL**: `https://your-site.pages.dev/admin` (or `https://ambdelights.com/admin` once the custom domain's live).
3. A short walkthrough — this is genuinely just three sections, so a 5-minute screen-share covers it:
   - **Contact & Hours** — WhatsApp number, phone, delivery area, hours, about text.
   - **Menu** — add/edit/remove dishes and prices per category.
   - **Gallery** — upload real photos to replace the placeholder tiles.

They never see `index.html`, JSON, or Git. They see a form with a **Publish** button.

## What stays your job (by design)

Colors, layout, fonts, new sections — that's still you, in the code. We deliberately didn't give the client a drag-and-drop design editor (see our earlier discussion) — that's a much bigger piece of software to build and maintain, and keeping design changes as a paid service from Smashstudio is both simpler for you to support and better business than free-for-all page building.
