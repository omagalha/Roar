/// <reference path="../deno.d.ts" />

type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
  home_team?: { name: string } | null;
  away_team?: { name: string } | null;
};

type SimulateGoalBody = {
  match_id: string;
  side?: "home" | "away";
  minute?: number;
};

const supabaseUrl = mustEnv("SUPABASE_URL");
const serviceRoleKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
const workerCronSecret = Deno.env.get("WORKER_CRON_SECRET");
const expoPushUrl = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (request: Request) => {
  const startedAt = Date.now();

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json() as SimulateGoalBody;
    if (!body.match_id) return json({ error: "match_id is required" }, 400);

    const match = await getMatch(body.match_id);
    if (!match) return json({ error: "Match not found" }, 404);

    const side = body.side ?? "home";
    const nextHomeGoals = match.home_goals + (side === "home" ? 1 : 0);
    const nextAwayGoals = match.away_goals + (side === "away" ? 1 : 0);
    const goalNumber = side === "home" ? nextHomeGoals : nextAwayGoals;
    const teamId = side === "home" ? match.home_team_id : match.away_team_id;
    const teamName = side === "home" ? match.home_team?.name : match.away_team?.name;

    await updateMatchScore(match.id, nextHomeGoals, nextAwayGoals);
    const event = await recordGoal({
      match,
      side,
      goalNumber,
      teamId,
      teamName: teamName ?? "Time",
      homeGoals: nextHomeGoals,
      awayGoals: nextAwayGoals,
      minute: body.minute ?? null,
    });
    const pushResult = await sendGoalPushes(event);
    await logWorkerRun({
      status: "ok",
      goalCount: 1,
      pushCount: pushResult.sent,
      durationMs: Date.now() - startedAt,
    });

    return json({ event, pushes: pushResult.sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown simulate-goal error";
    await logWorkerRun({
      status: "error",
      goalCount: 0,
      pushCount: 0,
      durationMs: Date.now() - startedAt,
      errorMessage: message,
    });
    return json({ error: message }, 500);
  }
});

async function getMatch(matchId: string): Promise<MatchRow | null> {
  const params = new URLSearchParams({
    select: "id,home_team_id,away_team_id,home_goals,away_goals,home_team:teams!matches_home_team_id_fkey(name),away_team:teams!matches_away_team_id_fkey(name)",
    id: `eq.${matchId}`,
    limit: "1",
  });
  const [match] = await supabaseFetch(`/rest/v1/matches?${params}`).then((response) => response.json());
  return match ?? null;
}

async function updateMatchScore(matchId: string, homeGoals: number, awayGoals: number) {
  await supabaseFetch(`/rest/v1/matches?id=eq.${matchId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "LIVE",
      home_goals: homeGoals,
      away_goals: awayGoals,
    }),
  });
}

async function recordGoal(input: {
  match: MatchRow;
  side: "home" | "away";
  goalNumber: number;
  teamId: string;
  teamName: string;
  homeGoals: number;
  awayGoals: number;
  minute: number | null;
}) {
  const externalEventId = `sim:${input.match.id}:goal:${input.side}:${input.goalNumber}`;
  const [event] = await supabaseFetch("/rest/v1/live_events?on_conflict=external_event_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify([{
      match_id: input.match.id,
      external_event_id: externalEventId,
      event_type: "goal",
      team_id: input.teamId,
      team_name: input.teamName,
      minute: input.minute,
      payload: {
        simulated: true,
        side: input.side,
        goal_number: input.goalNumber,
        league: "ROAR Test",
        score: { home: input.homeGoals, away: input.awayGoals },
        teams: {
          home: input.match.home_team?.name ?? "Casa",
          away: input.match.away_team?.name ?? "Fora",
        },
      },
    }]),
  }).then((response) => response.json());

  return event;
}

async function sendGoalPushes(event: Record<string, unknown>) {
  const matchId = String(event.match_id);
  const tokens = await getExpoTokens(matchId);
  const chunks = chunk(tokens, 100);
  let sent = 0;

  for (const tokenChunk of chunks) {
    const messages = tokenChunk.map((to) => ({
      to,
      sound: "default",
      channelId: "goals",
      title: `GOL! ${event.team_name}`,
      body: formatGoalBody(event),
      data: { match_id: matchId, event_id: event.id, type: "goal", simulated: true },
    }));

    const response = await fetch(expoPushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error(`Expo push failed: ${response.status} ${await response.text()}`);
    }

    sent += messages.length;
  }

  return { sent };
}

async function getExpoTokens(matchId: string): Promise<string[]> {
  const params = new URLSearchParams({
    select: "expo_push_token",
    match_id: `eq.${matchId}`,
    push_enabled: "eq.true",
  });
  const rows = await supabaseFetch(`/rest/v1/match_subscriptions?${params}`).then((response) => response.json());
  return [...new Set(rows.map((row: { expo_push_token: string }) => row.expo_push_token).filter(Boolean))];
}

function formatGoalBody(event: Record<string, unknown>) {
  const payload = event.payload as { score?: { home: number; away: number }; teams?: { home: string; away: string } };
  const score = payload?.score;
  const teams = payload?.teams;
  if (!score || !teams) return "Abre o ROAR para acompanhar ao vivo.";
  return `${teams.home} ${score.home} x ${score.away} ${teams.away}`;
}

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

async function logWorkerRun(input: {
  status: "ok" | "error";
  goalCount: number;
  pushCount: number;
  durationMs: number;
  errorMessage?: string;
}) {
  await supabaseFetch("/rest/v1/worker_runs", {
    method: "POST",
    body: JSON.stringify([{
      worker_name: "simulate-goal",
      status: input.status,
      checked_count: 1,
      goal_count: input.goalCount,
      push_count: input.pushCount,
      duration_ms: input.durationMs,
      error_message: input.errorMessage ?? null,
    }]),
  });
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  );
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
