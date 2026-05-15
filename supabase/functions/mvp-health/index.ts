/// <reference path="../deno.d.ts" />

const supabaseUrl = mustEnv("SUPABASE_URL");
const serviceRoleKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
const workerCronSecret = Deno.env.get("WORKER_CRON_SECRET");

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const [launch] = await supabaseFetch("/rest/v1/mvp_launch_check?select=*").then((response) => response.json());
    const rooms = await supabaseFetch(
      "/rest/v1/match_room_health?select=*&order=latest_event_at.desc.nullslast&limit=10",
    ).then((response) => response.json());

    return json({
      ok: launch?.latest_worker_status !== "error",
      launch,
      rooms,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Unknown health error" }, 500);
  }
});

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase failed: ${response.status} ${await response.text()}`);
  }

  return response;
}

function isAuthorized(request: Request) {
  if (!workerCronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${workerCronSecret}`;
}

function mustEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
