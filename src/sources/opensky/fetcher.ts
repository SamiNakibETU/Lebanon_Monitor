/**
 * OpenSky Network API — aircraft states in Lebanon bounding box.
 * NIC < 5 = low navigation integrity = probable GPS jamming.
 */

const LEBANON_BBOX = {
  lamin: 33.0,
  lamax: 34.7,
  lomin: 35.0,
  lomax: 36.7,
};

const URL = `https://opensky-network.org/api/states/all?lamin=${LEBANON_BBOX.lamin}&lamax=${LEBANON_BBOX.lamax}&lomin=${LEBANON_BBOX.lomin}&lomax=${LEBANON_BBOX.lomax}`;

export interface OpenSkyResult {
  count: number;
  jammingIndex: number;
}

export async function fetchOpenSky(): Promise<OpenSkyResult> {
  const res = await fetch(URL);
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
}
