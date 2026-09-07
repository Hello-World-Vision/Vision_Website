import { mkdir, writeFile } from 'node:fs/promises';

const endpoint = 'https://cicada.goatcounter.com/api/v0/stats/hits';
const token = process.env.GOATCOUNTER_API_KEY;
if (!token) throw new Error('GOATCOUNTER_API_KEY is not set');

const now = new Date();
const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const params = new URLSearchParams({ start: start.toISOString(), end: now.toISOString(), limit: '100' });
const response = await fetch(`${endpoint}?${params}`, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
});
if (!response.ok) throw new Error(`GoatCounter API returned ${response.status}: ${await response.text()}`);
const payload = await response.json();

// GoatCounter 的返回结构可能随 API 版本增加字段；只提取带时间和 count 的统计项。
const rows = [];
const walk = (value) => {
  if (Array.isArray(value)) return value.forEach(walk);
  if (!value || typeof value !== 'object') return;
  const timestamp = value.hour ?? value.time ?? value.date ?? value.day;
  const count = Number(value.count ?? value.visits ?? value.total);
  if (timestamp && Number.isFinite(count)) rows.push({ timestamp: String(timestamp), count });
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') walk(child);
  });
};
walk(payload);

const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
const daily = Array(daysInMonth).fill(0);
const hourly = Array(24).fill(0);
for (const row of rows) {
  const date = new Date(row.timestamp);
  if (Number.isNaN(date.getTime())) continue;
  if (date.getUTCFullYear() !== now.getUTCFullYear() || date.getUTCMonth() !== now.getUTCMonth()) continue;
  daily[date.getUTCDate() - 1] += row.count;
  hourly[date.getUTCHours()] += row.count;
}

await mkdir('public/data', { recursive: true });
await writeFile('public/data/visit.json', JSON.stringify({
  updatedAt: now.toISOString(), timezone: 'UTC', year: now.getUTCFullYear(), month: now.getUTCMonth() + 1,
  daily, hourly, total: daily.reduce((sum, value) => sum + value, 0),
}, null, 2) + '\n');
