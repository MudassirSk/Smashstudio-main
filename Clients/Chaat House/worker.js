// Worker entry point for "Workers with static assets" (the project type Cloudflare
// created for you). This replaces the functions/api/*.js files, which only work on
// classic Cloudflare Pages — this project is a Worker instead, recognizable by its
// dashboard URL containing /workers/services/.
//
// Requires two environment variables set in the Cloudflare dashboard:
// Worker → Settings → Variables and Secrets:
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/auth') {
      return handleAuth(url, env);
    }
    if (url.pathname === '/api/callback') {
      return handleCallback(url, env);
    }

    // Everything else: serve the static site (index.html, admin/, content/, etc.)
    return env.ASSETS.fetch(request);
  },
};

async function handleAuth(url, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Missing GITHUB_CLIENT_ID environment variable in Worker settings.', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/callback`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`, 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing OAuth code from GitHub.', { status: 400 });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable in Worker settings.', { status: 500 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 401 });
  }

  const payload = JSON.stringify({ token: tokenData.access_token, provider: 'github' });

  const html = `<!doctype html>
<html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:success:${payload}',
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
Login successful — you can close this window if it doesn't close automatically.
</body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
