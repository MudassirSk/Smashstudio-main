# AMB Delights — Setup & Client Handoff

This site now has two layers:
- **The design** (`index.html` + CSS) — you edit this, rarely.
- **The content** (`content/*.json`) — the client edits this, often, through a visual editor at `/admin` instead of touching code.

Follow these steps once, in order. It's a bit of setup up front, but every future client site reuses the same pattern.

## Part 1 — Put the project on GitHub

You said you want to manage clients in GitHub, so this replaces the "drag and drop" upload you did earlier with a proper Git-connected deployment (required for the CMS to work, since it commits changes back to the repo).

Run these in a terminal on your own computer (Terminal on Mac, or Command Prompt/PowerShell/Git Bash on Windows) — not in this chat. First download the `amb-delights` folder from this conversation and unzip it somewhere on your computer, e.g. your Desktop. Then open a terminal, navigate into that folder, and run:

```bash
cd path/to/amb-delights
git init
git add .
git commit -m "Initial AMB Delights site"
```

`cd path/to/amb-delights` should point at wherever you saved the folder — for example `cd Desktop/amb-delights` on Mac, or `cd Desktop\amb-delights` on Windows. If you don't have Git installed yet, install it first from [git-scm.com](https://git-scm.com) — the terminal will tell you `git: command not found` if it's missing.

Create a new repo on GitHub (e.g. `amb-delights`, or `smashstudio` if you're already grouping clients — see our earlier structure discussion), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**If this fails with `[rejected] main -> main (non-fast-forward)`:** it means the GitHub repo isn't empty — usually because you let GitHub add a README, `.gitignore`, or license when you created it. Your local commit and the remote one don't share history, so a normal push won't merge them. Fix it with:

```bash
git pull origin main --allow-unrelated-histories
```

This pulls the remote file(s) down and merges them with your local commit — Git may open a text editor for a merge commit message, in which case just save and close it (in the default `nano` editor: `Ctrl+O`, `Enter`, then `Ctrl+X`). If the remote file(s) conflict with yours, Git will tell you which files to resolve by hand before continuing. Once the pull succeeds, run `git push -u origin main` again.

To avoid this next time: when creating a new repo on GitHub, leave "Add a README file" and all other initialize options unchecked, so the repo starts empty and your first push just works.

## Part 2 — Connect to GitHub (Cloudflare may put you in "Workers" instead of classic "Pages")

Heads up: Cloudflare has been steering new git-connected projects toward its newer **"Workers with static assets"** flow instead of classic Pages, even from a button that looks like it says Pages. You can tell which one you're in from the dashboard URL:
- Classic Pages project → URL contains `/pages/view/`, settings show a **Framework preset** dropdown.
- Workers project → URL contains `/workers/services/`, settings show **Build command / Deploy command / Version command / Path** instead.

Both work fine for this project — the setup below is written for the **Workers** path, since that's what Cloudflare gave you (and increasingly gives everyone). If you land in classic Pages instead, use Framework preset **None**, empty build command, output directory `/`.

**For the Workers path** (what you have):

1. **Workers & Pages** → **Create** → connect the GitHub repo.
2. In **Settings → Builds & deployments → Build configuration**, leave the fields exactly as Cloudflare defaults them: **Build command** empty, **Deploy command** `npx wrangler deploy`, **Path** `/`. Don't try to change these — the project now ships with a `wrangler.jsonc` and `worker.js` at the repo root (see below) that `npx wrangler deploy` reads automatically.
3. Save and retry the deployment.

This repo includes two files that make the Workers path work:
- **`wrangler.jsonc`** — tells Wrangler the project name, where the static files live (`.`, the repo root), and which script to run for anything dynamic.
- **`worker.js`** — a small script that handles `/api/auth` and `/api/callback` (the GitHub OAuth handshake for Decap CMS) and passes every other request straight through to your static files. This replaces the `functions/api/*.js` files from the classic-Pages version — those only work if you end up on classic Pages instead, and can be ignored otherwise.

If you'd already attached a custom domain to an earlier project, move it under **Domains** in this Worker's settings once it's deploying successfully.

From now on: every `git push` to `main` auto-deploys. This is also what makes Decap CMS's commits go live automatically.

## Part 3 — Create a GitHub OAuth App (so Decap CMS can log the client in)

1. GitHub → your account **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Fill in:
   - **Application name**: `AMB Delights CMS` (anything descriptive)
   - **Homepage URL**: your Worker's URL, e.g. `https://smashstudio.YOUR-SUBDOMAIN.workers.dev` (find the exact URL on the Worker's **Overview** tab once it's deployed)
   - **Authorization callback URL**: same URL
3. Register the app. GitHub shows a **Client ID** — copy it. Click **Generate a new client secret** — copy that too (you won't see it again).

## Part 4 — Add the OAuth credentials to Cloudflare

1. In your Worker project → **Settings** → **Variables and Secrets**.
2. Add two variables:
   - `GITHUB_CLIENT_ID` → the Client ID from Part 3 (plain variable is fine)
   - `GITHUB_CLIENT_SECRET` → the Client secret from Part 3 — click **Encrypt** so it's stored as a secret, not plain text
3. Save. Environment variable changes don't apply to deployments that already ran, so you need to trigger a fresh one. The exact button varies by dashboard version and whether your last deployment succeeded or failed, so the reliable way that always works: push a small commit to trigger a new build.

   ```bash
   git commit --allow-empty -m "Trigger redeploy with new env vars"
   git push
   ```

   Watch the **Deployments** tab for the new one to finish, then `worker.js` will have the variables available.

## Part 5 — Point the CMS config at your real repo and URL

Open `admin/config.yml` and replace:
- `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` → your actual repo, e.g. `smashstudio/amb-delights`
- `https://YOUR-SITE.pages.dev` → your actual site URL (the `.workers.dev` URL from the Worker's Overview tab, or your custom domain once attached) — no trailing slash

Commit and push this change.

## Part 6 — Test it yourself first

1. Visit `https://your-site-url/admin` (your `.workers.dev` URL or custom domain).
2. Click **Login with GitHub**, authorize the OAuth app.
3. You should see three collections: **Contact & Hours**, **Menu**, **Gallery**.
4. Edit something small (e.g. a menu price), click **Publish**.
5. Check your GitHub repo — you should see a new commit from your GitHub account. Check the live site a minute later — the change should be there.

**Important:** because this uses the `github` backend directly (not an editorial workflow), publishing commits straight to `main` and goes live immediately — there's no draft/review step. That's the right tradeoff for a single trusted client editor; if you ever want a review step before changes go live, Decap supports an `editorial_workflow` mode that opens a pull request instead — worth adding once a client's team grows past one editor.

## Part 7 — Hand off to the client

What the client needs from you:
1. **A GitHub account** (free) — either create one for them, or have them make one. They need to be a **collaborator** on the repo (GitHub → repo → **Settings** → **Collaborators** → add them) so the OAuth login works.
2. **The admin URL**: your Worker's `.workers.dev/admin` URL, or `https://ambdelights.com/admin` once the custom domain's live.
3. A short walkthrough — this is genuinely just three sections, so a 5-minute screen-share covers it:
   - **Contact & Hours** — WhatsApp number, phone, delivery area, hours, about text.
   - **Menu** — add/edit/remove dishes and prices per category.
   - **Gallery** — upload real photos to replace the placeholder tiles.

They never see `index.html`, JSON, or Git. They see a form with a **Publish** button.

## What stays your job (by design)

Colors, layout, fonts, new sections — that's still you, in the code. We deliberately didn't give the client a drag-and-drop design editor (see our earlier discussion) — that's a much bigger piece of software to build and maintain, and keeping design changes as a paid service from Smashstudio is both simpler for you to support and better business than free-for-all page building.
