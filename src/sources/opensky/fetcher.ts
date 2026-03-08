/**
 * OpenSky Network API — aircraft states in Lebanon bounding box.
 * NIC < 5 = low navigation integrity = probable GPS jamming.
 * Timeout 20s (Railway can have slow egress to opensky-network.org).
 */

const LEBANON_BBOX = {
  lamin: 33.0,
  lamax: 34.7,
  lomin: 35.0,
  lomax: 36.7,
};

const URL = `https://opensky-network.org/api/states/all?lamin=${LEBANON_BBOX.lamin}&lamax=${LEBANON_BBOX.lamax}&lomin=${LEBANON_BBOX.lomin}&lomax=${LEBANON_BBOX.lomax}`;
const OPENSKY_TIMEOUT_MS = 20_000;

export interface OpenSkyResult {
  count: number;
  jammingIndex: number;
}

/** Aircraft position for map layer. lon, lat from OpenSky states array indices 5, 6. nic at 16. */
export interface OpenSkyPosition {
  lon: number;
  lat: number;
  nic: number;
  icao24?: string;
}

export async function fetchOpenSkyPositions(): Promise<
  | { ok: true; positions: OpenSkyPosition[] }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENSKY_TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return { ok: false, error: `OpenSky ${res.status}` };
    const data = (await res.json()) as { states?: Array<unknown[]> };
    const states = data.states ?? [];

    const positions: OpenSkyPosition[] = states
      .filter((s): s is unknown[] => Array.isArray(s) && s.length >= 17)
      .map((s) => {
        const lon = Number(s[5]);
        const lat = Number(s[6]);
        const nic = typeof s[16] === 'number' ? s[16] : 0;
        return { lon, lat, nic, icao24: typeof s[0] === 'string' ? s[0] : undefined };
      })
      .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));

    return { ok: true, positions };
  } catch (e) {
    clearTimeout(timeoutId);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchOpenSky(): Promise<OpenSkyResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENSKY_TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const data = (await res.json()) as { states?: Array<unknown[]> };
    const states = data.states ?? [];
    const count = states.length;

    const withLowNic = states.filter((s) => {
      if (!Array.isArray(s) || s.length < 18) return false;
      const nic = typeof s[16] === 'number' ? s[16] : null;
      return nic != null && nic < 5;
    }).length;

    const jammingIndex = count > 0 ? Math.round(100 * (withLowNic / count)) : 0;

    return { count, jammingIndex };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}
