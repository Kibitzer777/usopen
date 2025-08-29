import { LRUCache } from 'lru-cache';
import { DateTime } from 'luxon';
import { convertUtcToEastern } from './time';

type Tour = 'atp' | 'wta';

export type UsOpenMatch = {
  id: string;
  tour: 'ATP' | 'WTA';
  court?: string;
  round?: string;
  startISO?: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'delayed';
  gameClock?: string;
  players: Array<{
    name: string;
    seed?: string;
    countryCode?: string;
    winner?: boolean;
    scoreTotal?: number;
    setScores?: number[];
  }>;
};

export type GroupedMatches = {
  live: NormalizedMatch[];
  upcoming: NormalizedMatch[];
  completed: NormalizedMatch[];
};

// Match shape expected by the current UI
export interface NormalizedMatch {
  id: string;
  round: string;
  court: string;
  startTime: string; // ISO in ET
  status: 'live' | 'upcoming' | 'completed';
  players: [
    { name: string; seed?: number; countryCode: string; flagEmoji: string },
    { name: string; seed?: number; countryCode: string; flagEmoji: string }
  ];
  sets: [number, number][];
  currentGame?: { p1Points: number; p2Points: number };
}

const cache = new LRUCache<string, any>({ max: 100, ttl: 5_000 });
const livePointsCache = new LRUCache<string, any>({ max: 200, ttl: 15_000 });

function toYYYYMMDD(iso: string): string {
  return iso.replaceAll('-', '');
}

function isSameEtDay(utcIso?: string, targetDateISO?: string): boolean {
  if (!utcIso || !targetDateISO) return false;
  try {
    const et = convertUtcToEastern(DateTime.fromISO(utcIso).toUTC().toISO() || '');
    return et.toISODate() === targetDateISO;
  } catch {
    return false;
  }
}

// Map ESPN status -> our status
function mapStatus(espnStatus?: string): 'scheduled' | 'in_progress' | 'final' | 'delayed' {
  switch ((espnStatus || '').toUpperCase()) {
    case 'STATUS_SCHEDULED':
      return 'scheduled';
    case 'STATUS_IN_PROGRESS':
      return 'in_progress';
    case 'STATUS_FINAL':
      return 'final';
    default:
      return 'delayed';
  }
}

async function fetchScoreboard(tour: Tour, yyyymmdd: string): Promise<any> {
  // cache-buster bucketed to 5s so repeated polls within 5s reuse the same request
  const cb = Math.floor(Date.now() / 5000);
  const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard?dates=${yyyymmdd}&cb=${cb}`;
  const cacheKey = `espn:${tour}:${yyyymmdd}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { cache: 'no-store' as any, signal: controller.signal, headers: { 'Accept': 'application/json' } });
    clearTimeout(t);
    if (!res.ok) throw new Error(`ESPN ${tour} ${yyyymmdd}: ${res.status} ${res.statusText}`);
    const json = await res.json();
    cache.set(cacheKey, json);
    return json;
  } catch (err) {
    console.error('ESPN fetch error:', err);
    return { events: [] };
  }
}

function isUsOpenEvent(event: any): boolean {
  const lc = (s: any) => (typeof s === 'string' ? s.toLowerCase() : '');
  return (
    lc(event?.name).includes('us open') ||
    lc(event?.shortName).includes('us open') ||
    lc(event?.league?.name).includes('us open')
  );
}

function extractRound(comp: any): string {
  return (
    comp?.round?.displayName ||
    comp?.round?.name ||
    comp?.status?.type?.description ||
    comp?.status?.type?.detail ||
    'Round'
  );
}

function extractCourt(comp: any): string {
  return comp?.venue?.fullName || comp?.venue?.shortName || 'Court TBD';
}

function toFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
}

function normalizeCompetitionToUiMatch(event: any, comp: any): NormalizedMatch | null {
  try {
    const statusMapped = mapStatus(comp?.status?.type?.name);

    const competitors: any[] = comp?.competitors || [];
    const p1 = competitors[0] || {};
    const p2 = competitors[1] || {};

    const getSeed = (c: any): number | undefined => {
      const seed = c?.seed || c?.athlete?.seed || c?.team?.seed;
      const n = Number(seed);
      return Number.isFinite(n) ? n : undefined;
    };

    const getCountry = (c: any): string | undefined => {
      return (
        c?.athlete?.flag?.alt ||
        c?.athlete?.country?.code ||
        c?.team?.locationCode ||
        undefined
      );
    };

    const lines1 = Array.isArray(p1?.linescores) ? p1.linescores : [];
    const lines2 = Array.isArray(p2?.linescores) ? p2.linescores : [];
    const setPairs: [number, number][] = [];
    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      const v1 = Number(lines1[i]?.value ?? 0);
      const v2 = Number(lines2[i]?.value ?? 0);
      if (!Number.isNaN(v1) || !Number.isNaN(v2)) setPairs.push([v1, v2]);
    }

    const startIsoUtc = comp?.startDate || comp?.date || event?.date;
    const startEt = startIsoUtc
      ? convertUtcToEastern(DateTime.fromISO(startIsoUtc).toUTC().toISO() || '').toISO() || ''
      : '';

    return {
      id: String(comp?.id || event?.uid || event?.id || Math.random()),
      round: extractRound(comp),
      court: extractCourt(comp),
      startTime: startEt || new Date().toISOString(),
      status:
        statusMapped === 'in_progress'
          ? 'live'
          : statusMapped === 'final'
          ? 'completed'
          : 'upcoming',
      players: [
        {
          name: p1?.athlete?.displayName || p1?.team?.displayName || p1?.displayName || 'TBD',
          seed: getSeed(p1),
          countryCode: getCountry(p1) || '',
          flagEmoji: toFlagEmoji(getCountry(p1)),
        },
        {
          name: p2?.athlete?.displayName || p2?.team?.displayName || p2?.displayName || 'TBD',
          seed: getSeed(p2),
          countryCode: getCountry(p2) || '',
          flagEmoji: toFlagEmoji(getCountry(p2)),
        },
      ],
      sets: setPairs,
    };
  } catch (e) {
    console.error('normalizeCompetitionToUiMatch error:', e);
    return null;
  }
}

// Try to fetch current game points for a live competition using best-effort public endpoints
async function fetchCurrentGamePoints(eventOrCompUid: string, compId?: string): Promise<{ p1: number; p2: number } | null> {
  const cacheKey = `lp:${eventOrCompUid}:${compId || ''}`;
  const cached = livePointsCache.get(cacheKey);
  if (cached) return cached;

  const candidates: string[] = [];
  if (eventOrCompUid) {
    candidates.push(`https://site.web.api.espn.com/apis/v2/sports/tennis/summary?event=${encodeURIComponent(eventOrCompUid)}`);
    candidates.push(`https://site.api.espn.com/apis/site/v2/sports/tennis/summary?event=${encodeURIComponent(eventOrCompUid)}`);
  }
  if (compId) {
    candidates.push(`https://sports.core.api.espn.com/v2/sports/tennis/competitions/${compId}`);
    candidates.push(`https://sports.core.api.espn.com/v2/sports/tennis/competitions/${compId}/details`);
  }

  const asNumber = (v: any): number | null => {
    if (v === 'AD' || v === 'Adv' || v === 'ADV' || v === 'Ad') return 50;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const scanForPoints = (obj: any): { a?: any; b?: any } | null => {
    if (!obj || typeof obj !== 'object') return null;
    // Look for competitors with point/points fields
    if (Array.isArray(obj.competitors) && obj.competitors.length >= 2) {
      const c1 = obj.competitors[0];
      const c2 = obj.competitors[1];
      const p1 = c1?.point ?? c1?.points ?? c1?.currentPoint ?? c1?.gamePoints ?? c1?.tennisPoint;
      const p2 = c2?.point ?? c2?.points ?? c2?.currentPoint ?? c2?.gamePoints ?? c2?.tennisPoint;
      if (p1 !== undefined || p2 !== undefined) return { a: p1, b: p2 };
    }
    // Generic deep-scan limited breadth
    for (const k of Object.keys(obj)) {
      const val = (obj as any)[k];
      if (val && typeof val === 'object') {
        const res = scanForPoints(val);
        if (res) return res;
      }
    }
    return null;
  };

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      const found = scanForPoints(json);
      if (found) {
        const p1n = asNumber(found.a);
        const p2n = asNumber(found.b);
        if (p1n !== null && p2n !== null) {
          const payload = { p1: p1n, p2: p2n };
          livePointsCache.set(cacheKey, payload);
          return payload;
        }
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
}

export async function getMatchesByDate(gender: 'men' | 'women', dateISO: string): Promise<GroupedMatches> {
  const yyyymmdd = toYYYYMMDD(dateISO);
  // Fetch both tours to be safe; some tournaments expose groupings via either feed
  const [atpData, wtaData] = await Promise.all([
    fetchScoreboard('atp', yyyymmdd),
    fetchScoreboard('wta', yyyymmdd),
  ]);

  const allEvents: any[] = [];
  if (Array.isArray(atpData?.events)) allEvents.push(...atpData.events);
  if (Array.isArray(wtaData?.events)) allEvents.push(...wtaData.events);

  // Deduplicate events by uid/id
  const uniqueEvents = Array.from(
    new Map(allEvents.map((e: any) => [String(e?.uid || e?.id), e])).values()
  );

  const filteredEvents = uniqueEvents.filter(isUsOpenEvent);
  const normalized: NormalizedMatch[] = [];
  const seenCompIds = new Set<string>();
  for (const ev of filteredEvents) {
    const groupingItems: any[] = Array.isArray(ev?.groupings) ? ev.groupings : [];
    for (const gi of groupingItems) {
      const slug: string = (gi?.grouping?.slug || '').toLowerCase();
      if (gender === 'men' && slug !== 'mens-singles') continue;
      if (gender === 'women' && slug !== 'womens-singles') continue;
      const comps: any[] = Array.isArray(gi?.competitions) ? gi.competitions : [];
      for (const comp of comps) {
        // Filter by selected ET date
        const compStart = comp?.startDate || comp?.date || ev?.date;
        if (!isSameEtDay(compStart, dateISO)) continue;
        const compId = String(comp?.id || '');
        if (compId && seenCompIds.has(compId)) continue;
        const n = normalizeCompetitionToUiMatch(ev, comp);
        if (n) normalized.push(n);
        if (compId) seenCompIds.add(compId);
      }
    }
  }

  // Enrich live matches with current game points (best-effort)
  const live = await Promise.all(
    normalized
    .filter((m) => m.status === 'live')
    .map(async (m) => {
      try {
        const points = await fetchCurrentGamePoints((m as any).uid || '', (m as any).id);
        if (points) {
          (m as any).currentGame = { p1Points: points.p1, p2Points: points.p2 };
        }
      } catch {}
      return m;
    })
  );
  live.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const upcoming = normalized
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const completed = normalized
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return { live, upcoming, completed };
}


