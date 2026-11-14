const BACKEND_ORIGIN =
  "https://astrohealth-api-654347430527.europe-west1.run.app";

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);

  const targetUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    BACKEND_ORIGIN
  );

  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const upstreamRequest = new Request(targetUrl, {
    method: context.request.method,
    headers,
    body: ["GET", "HEAD"].includes(context.request.method)
      ? undefined
      : context.request.body,
    redirect: "manual",
  });

  const upstreamResponse = await fetch(upstreamRequest);

  const responseHeaders = new Headers(upstreamResponse.headers);

  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-credentials");
  responseHeaders.delete("access-control-allow-methods");
  responseHeaders.delete("access-control-allow-headers");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  responseHeaders.set("Cache-Control", "no-store");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}