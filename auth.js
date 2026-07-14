// Cloudflare Pages Function — GET /api/auth
// Kicks off the GitHub OAuth flow when someone clicks "Login with GitHub" in Decap CMS.
// Requires two environment variables set in Cloudflare Pages > Settings > Environment variables:
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET  (used in callback.js, not here, but set both together)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Missing GITHUB_CLIENT_ID environment variable in Cloudflare Pages settings.', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/callback`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`, 302);
}
