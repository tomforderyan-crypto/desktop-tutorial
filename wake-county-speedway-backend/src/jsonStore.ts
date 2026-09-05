import { promises as fs } from 'fs';
import path from 'path';

/**
 * Minimal JSON-file-backed store — enough to let staff update banner ads,
 * food vendors, social accounts, and orders without redeploying, without
 * standing up a real database for a v1. Writes are serialized per file via
 * a promise chain so two concurrent PUTs can't interleave and corrupt the
 * file. Swap this for Postgres/SQLite before this handles real order
 * volume or multiple staff editing concurrently — a single JSON file has
 * no transaction guarantees beyond "one writer at a time in this process."
 */
const DATA_DIR = path.join(__dirname, '..', 'data');

const writeQueues = new Map<string, Promise<void>>();

function filePath(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(name), 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

export async function writeJson<T>(name: string, data: T): Promise<void> {
  const previous = writeQueues.get(name) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(filePath(name), JSON.stringify(data, null, 2), 'utf-8');
    });
  writeQueues.set(name, next);
  return next;
}
