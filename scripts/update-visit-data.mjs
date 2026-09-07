import { mkdir, writeFile } from 'node:fs/promises';

const token = process.env.GOATCOUNTER_API_KEY;
if (!token) throw new Error('GOATCOUNTER_API_KEY is not set');

const now = new Date();
const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0));
const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));
const params = new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), limit: '100' });
const response = await fetch(`https://cicada.goatcounter.com/api/v0/stats/hits?${params}`, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
});
if (!response.ok) throw new Error(`GoatCounter API returned ${response.status}: ${await response.text()}`);
const payload = await response.json();

const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
const rawDaily = Array(daysInMonth).fill(0);
const rawHourly = Array(24).fill(0);
const hits = Array.isArray(payload.hits) ? payload.hits : [];

for (const hit of hits) {
  for (const stat of Array.isArray(hit.stats) ? hit.stats : []) {
    const date = new Date(`${stat.day}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.getUTCFullYear() !== now.getUTCFullYear() || date.getUTCMonth() !== now.getUTCMonth()) continue;
    rawDaily[date.getUTCDate() - 1] += Number(stat.daily) || 0;
    if (Array.isArray(stat.hourly)) stat.hourly.forEach((value, hour) => { rawHourly[hour] += Number(value) || 0; });
  }
}

const apiTotal = Number(payload.total);
const rawTotal = rawDaily.reduce((sum, value) => sum + value, 0);
const scale = Number.isFinite(apiTotal) && apiTotal > 0 && rawTotal > apiTotal ? apiTotal / rawTotal : 1;
const daily = rawDaily.map((value) => Math.round(value * scale));
const hourly = rawHourly.map((value) => Math.round(value * scale));

await mkdir('public/data', { recursive: true });
await writeFile('public/data/visit.json', JSON.stringify({
  updatedAt: now.toISOString(), timezone: 'UTC', year: now.getUTCFullYear(), month: now.getUTCMonth() + 1,
  daily, hourly, total: daily.reduce((sum, value) => sum + value, 0),
}, null, 2) + '\n');

