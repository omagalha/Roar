/// <reference path="../deno.d.ts" />

type ApiFootballFixture = {
  fixture: {
    id: number;
    date?: string;
    status?: { short?: string; elapsed?: number | null };
  };
  league?: { name?: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
};

type SupabaseRow = {
  match_id: string;
  home_goals: number;
  away_goals: number;
};

type MatchRow = {
  id: string;
  external_fixture_id: number;
};

const supabaseUrl = mustEnv("SUPABASE_URL");
const serviceRoleKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
const apiFootballKey = mustEnv("API_FOOTBALL_KEY");

const apiFootballHost = Deno.env.get("API_FOOTBALL_HOST") ?? "v3.football.api-sports.io";
const apiFootballAuthHeader = Deno.env.get("API_FOOTBALL_AUTH_HEADER") ?? "x-apisports-key";
const workerCronSecret = Deno.env.get("WORKER_CRON_SECRET");
const expoPushUrl = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (request: Request) => {
  const startedAt = Date.now();

  if (request.method !== "POST" && request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const fixtures = await fetchLiveFixtures();
    const goals = await detectNewGoals(fixtures);
    const pushResults = await Promise.all(goals.map(sendGoalPushes));
    const pushes = pushResults.reduce((sum, result) => sum + result.sent, 0);

    await logWorkerRun({
      status: "ok",
      checkedCount: fixtures.length,
      goalCount: goals.length,
      pushCount: pushes,
      durationMs: Date.now() - startedAt,
    });

    return json({
      checked: fixtures.length,
      goals: goals.length,
      pushes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await logWorkerRun({
      status: "error",
      checkedCount: 0,
      goalCount: 0,
      pushCount: 0,
      durationMs: Date.now() - startedAt,
      errorMessage: message,
    });
    return json({ error: message }, 500);
  }
});

async function fetchLiveFixtures(): Promise<ApiFootballFixture[]> {
  const response = await fetch(`https://${apiFootballHost}/fixtures?live=all`, {
    headers: {
      [apiFootballAuthHeader]: apiFootballKey,
      "x-rapidapi-host": apiFootballHost,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.response ?? [];
}

async function detectNewGoals(fixtures: ApiFootballFixture[]) {
  const liveFixtures = fixtures.filter((fixture) => isPlayable(fixture.fixture.status?.short));
  const matchIds = liveFixtures.map((fixture) => String(fixture.fixture.id));
  const previousRows = matchIds.length ? await getPreviousRows(matchIds) : [];
  const previousByMatch = new Map(previousRows.map((row) => [row.match_id, row]));
  const goals = [];

  for (const fixture of liveFixtures) {
    const fixtureId = String(fixture.fixture.id);
    const match = await ensureMatch(fixture);
    const homeGoals = fixture.goals.home ?? 0;
    const awayGoals = fixture.goals.away ?? 0;
    const previous = previousByMatch.get(fixtureId);

    if (!previous) {
      await upsertScore(fixtureId, homeGoals, awayGoals);
      await updateMatchScore(match.id, fixture, homeGoals, awayGoals);
      continue;
    }

    if (homeGoals > previous.home_goals) {
      for (let goalNumber = previous.home_goals + 1; goalNumber <= homeGoals; goalNumber += 1) {
        goals.push(await recordGoal(match.id, fixture, "home", homeGoals, awayGoals, goalNumber));
      }
    }

    if (awayGoals > previous.away_goals) {
      for (let goalNumber = previous.away_goals + 1; goalNumber <= awayGoals; goalNumber += 1) {
        goals.push(await recordGoal(match.id, fixture, "away", homeGoals, awayGoals, goalNumber));
      }
    }

    if (homeGoals !== previous.home_goals || awayGoals !== previous.away_goals) {
      await upsertScore(fixtureId, homeGoals, awayGoals);
      await updateMatchScore(match.id, fixture, homeGoals, awayGoals);
    }
  }

  return goals.filter(Boolean);
}

async function getPreviousRows(matchIds: string[]): Promise<SupabaseRow[]> {
  const params = new URLSearchParams({
    select: "match_id,home_goals,away_goals",
    match_id: `in.(${matchIds.join(",")})`,
  });
  return supabaseFetch(`/rest/v1/match_goal_state?${params}`).then((response) => response.json());
}

async function upsertScore(matchId: string, homeGoals: number, awayGoals: number) {
  await supabaseFetch("/rest/v1/match_goal_state?on_conflict=match_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ match_id: matchId, home_goals: homeGoals, away_goals: awayGoals }]),
  });
}

async function recordGoal(
  matchId: string,
  fixture: ApiFootballFixture,
  side: "home" | "away",
  homeGoals: number,
  awayGoals: number,
  goalNumber: number,
) {
  const fixtureId = String(fixture.fixture.id);
  const scoringTeam = side === "home" ? fixture.teams.home : fixture.teams.away;
  const externalEventId = `${fixtureId}:goal:${side}:${goalNumber}`;
  const [event] = await supabaseFetch("/rest/v1/live_events?on_conflict=external_event_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify([{
      match_id: matchId,
      external_event_id: externalEventId,
      event_type: "goal",
      team_id: String(scoringTeam.id),
      team_name: scoringTeam.name,
      minute: fixture.fixture.status?.elapsed ?? null,
      payload: {
        side,
        goal_number: goalNumber,
        league: fixture.league?.name ?? null,
        score: { home: homeGoals, away: awayGoals },
        teams: { home: fixture.teams.home.name, away: fixture.teams.away.name },
      },
    }]),
  }).then((response) => response.json());

  return event;
}

async function ensureMatch(fixture: ApiFootballFixture): Promise<MatchRow> {
  await supabaseFetch("/rest/v1/teams?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        id: String(fixture.teams.home.id),
        name: fixture.teams.home.name,
        country: "",
      },
      {
        id: String(fixture.teams.away.id),
        name: fixture.teams.away.name,
        country: "",
      },
    ]),
  });

  const [match] = await supabaseFetch("/rest/v1/matches?on_conflict=external_fixture_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([{
      external_fixture_id: fixture.fixture.id,
      home_team_id: String(fixture.teams.home.id),
      away_team_id: String(fixture.teams.away.id),
      starts_at: fixture.fixture.date ?? new Date().toISOString(),
      status: mapFixtureStatus(fixture.fixture.status?.short),
      home_goals: fixture.goals.home ?? 0,
      away_goals: fixture.goals.away ?? 0,
    }]),
  }).then((response) => response.json());

  return match;
}

async function updateMatchScore(
  matchId: string,
  fixture: ApiFootballFixture,
  homeGoals: number,
  awayGoals: number,
) {
  await supabaseFetch(`/rest/v1/matches?id=eq.${matchId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: mapFixtureStatus(fixture.fixture.status?.short),
      home_goals: homeGoals,
      away_goals: awayGoals,
    }),
  });
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
      data: { match_id: matchId, event_id: event.id, type: "goal" },
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
  checkedCount: number;
  goalCount: number;
  pushCount: number;
  durationMs: number;
  errorMessage?: string;
}) {
  await supabaseFetch("/rest/v1/worker_runs", {
    method: "POST",
    body: JSON.stringify([{
      worker_name: "goal-worker",
      status: input.status,
      checked_count: input.checkedCount,
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

function isPlayable(status?: string) {
  return status ? !["NS", "FT", "AET", "PEN", "PST", "CANC", "ABD"].includes(status) : true;
}

function mapFixtureStatus(status?: string) {
  if (status === "1H" || status === "2H" || status === "ET" || status === "P") return "LIVE";
  if (status === "HT" || status === "BT") return "HT";
  if (status === "FT" || status === "AET" || status === "PEN") return "FT";
  if (status === "PST") return "PST";
  if (status === "CANC" || status === "ABD") return "CANC";
  return "NS";
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
