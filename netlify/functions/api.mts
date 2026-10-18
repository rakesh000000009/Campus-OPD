/**
 * Campus OPD API - Netlify Function
 *
 * Wraps the existing Express backend (backend/app.js) so the whole REST API
 * runs as a single serverless function. All /api/* traffic is routed here
 * by the in-code path config below; the SPA itself is served statically.
 */
import serverlessHttp from "serverless-http";
import expressApp from "../../backend/app.js";
import type { Config } from "@netlify/functions";

const serverlessHandler = serverlessHttp(expressApp);

export default async (req: Request) => {
  const url = new URL(req.url);

  // Read the raw body once (empty for GET/HEAD)
  const rawBody = req.method === "GET" || req.method === "HEAD"
    ? null
    : Buffer.from(await req.arrayBuffer());

  const event = {
    httpMethod: req.method,
    path: url.pathname,
    headers: Object.fromEntries(req.headers.entries()),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    body: rawBody ? rawBody.toString("base64") : null,
    isBase64Encoded: Boolean(rawBody),
    requestContext: {
      http: {
        method: req.method,
        path: url.pathname,
        sourceIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
      },
    },
  };

  const result = (await serverlessHandler(event as any)) as {
    statusCode: number;
    headers: Record<string, string | string[]>;
    body?: string | null;
    isBase64Encoded?: boolean;
  };

  const headers = new Headers();
  for (const [key, value] of Object.entries(result.headers || {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, String(v));
    } else {
      headers.set(key, String(value));
    }
  }

  const bodyBuffer = result.body
    ? Buffer.from(result.body, result.isBase64Encoded ? "base64" : "utf8")
    : null;

  return new Response(bodyBuffer, {
    status: result.statusCode || 200,
    headers,
  });
};

export const config: Config = {
  path: "/api/:path*",
};
