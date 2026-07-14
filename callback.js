// Cloudflare Pages Function — GET /api/callback
// GitHub redirects here after the client approves access. We exchange the
// temporary code for an access token, then hand it to the Decap CMS popup
// window via postMessage, following Decap's documented OAuth popup protocol.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing OAuth code from GitHub.', { status: 400 });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable in Cloudflare Pages settings.', { status: 500 });
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

  // This exact message format and handshake is what Decap CMS's popup listener expects.
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
