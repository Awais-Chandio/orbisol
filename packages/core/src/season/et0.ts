/**
 * Orbisol core - FAO-56 Penman-Monteith reference evapotranspiration (ET0), daily.
 * Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration - Guidelines for
 * computing crop water requirements. FAO Irrigation and Drainage Paper 56. https://www.fao.org/4/x0490e/x0490e00.htm
 * Equation numbers refer to that paper. Soil heat flux G is taken as 0 for daily steps (eq. 42).
 *
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */

const GSC = 0.082; // solar constant, MJ m-2 min-1
const SIGMA = 4.903e-9; // Stefan-Boltzmann, MJ K-4 m-2 day-1
const ALBEDO = 0.23; // grass reference crop

/** Saturation vapour pressure at T °C, kPa (eq. 11). */
export function satVapourPressure(tC: number): number {
  return 0.6108 * Math.exp((17.27 * tC) / (tC + 237.3));
}

/** Atmospheric pressure from elevation, kPa (eq. 7). */
export function pressureFromElevation(zM: number): number {
  return 101.3 * Math.pow((293 - 0.0065 * zM) / 293, 5.26);
}

/** Extraterrestrial radiation Ra, MJ m-2 day-1 (eqs. 21-25). */
export function extraterrestrialRadiation(latDeg: number, dayOfYear: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  return (
    ((24 * 60) / Math.PI) *
    GSC *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
  );
}

export interface Et0Input {
  tmaxC: number;
  tminC: number;
  /** Actual vapour pressure, kPa. Use satVapourPressure(dewPointC) when dew point is known (eq. 14). */
  eaKPa: number;
  /** Incoming shortwave (solar) radiation Rs, MJ m-2 day-1. */
  rsMJ: number;
  /** Wind speed at 2 m, m/s. */
  u2: number;
  elevationM: number;
  latDeg: number;
  dayOfYear: number;
}

/** Daily ET0 in mm/day (eq. 6). NaN if any input is missing. Never negative. */
export function fao56Et0(i: Et0Input): number {
  const vals = [i.tmaxC, i.tminC, i.eaKPa, i.rsMJ, i.u2, i.elevationM, i.latDeg, i.dayOfYear];
  if (!vals.every(Number.isFinite)) return Number.NaN;
  const tmean = (i.tmaxC + i.tminC) / 2;
  const gamma = 0.000665 * pressureFromElevation(i.elevationM); // eq. 8
  const es = (satVapourPressure(i.tmaxC) + satVapourPressure(i.tminC)) / 2; // eq. 12
  const delta = (4098 * satVapourPressure(tmean)) / Math.pow(tmean + 237.3, 2); // eq. 13
  const ra = extraterrestrialRadiation(i.latDeg, i.dayOfYear);
  const rso = (0.75 + 2e-5 * i.elevationM) * ra; // eq. 37
  const rns = (1 - ALBEDO) * i.rsMJ; // eq. 38
  const ratio = rso > 0 ? Math.min(i.rsMJ / rso, 1) : 1;
  const tk4 = (Math.pow(i.tmaxC + 273.16, 4) + Math.pow(i.tminC + 273.16, 4)) / 2;
  const rnl = SIGMA * tk4 * (0.34 - 0.14 * Math.sqrt(Math.max(i.eaKPa, 0))) * (1.35 * ratio - 0.35); // eq. 39
  const rn = rns - rnl; // eq. 40
  const num = 0.408 * delta * rn + gamma * (900 / (tmean + 273)) * i.u2 * (es - i.eaKPa);
  const den = delta + gamma * (1 + 0.34 * i.u2);
  return Math.max(0, num / den);
}

/** Day of year 1-366 for an ISO date. */
export function dayOfYear(iso: string): number {
  const y = Number(iso.slice(0, 4));
  const t = Date.UTC(y, Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((t - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}
