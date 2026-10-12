import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface QuotaRecord {
  status: 'reserved' | 'consumed';
  reservedAt: number;
  consumedAt?: number;
  query?: string;
  claimText?: string;
}

export type QuotaStore = Record<string, QuotaRecord>;

let quotaLock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prevLock = quotaLock;
  quotaLock = quotaLock.then(() => nextLock);

  return prevLock.then(() => {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res.finally(() => release());
      }
      release();
      return res;
    } catch (err) {
      release();
      throw err;
    }
  });
}

export function getQuotaFilePath(): string {
  const baseDir = fs.existsSync(path.join(process.cwd(), 'apps', 'web'))
    ? path.join(process.cwd(), 'apps', 'web', '.quota')
    : path.join(process.cwd(), '.quota');

  if (!fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, { recursive: true });
    } catch {
      // In case directory already created
    }
  }

  return path.join(baseDir, 'live-quota.json');
}

function loadStore(filePath: string): QuotaStore {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as QuotaStore;
  } catch {
    return {};
  }
}

function saveStoreAtomic(filePath: string, store: QuotaStore): void {
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function getVisitorIdentifier(req: Request): { visitorId: string; isNewCookie: boolean } {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((pair) => pair.length === 2)
  );

  const existingVid = cookies['notedrift_vid'];
  if (existingVid && /^[a-zA-Z0-9_\-]+$/.test(existingVid)) {
    return { visitorId: existingVid, isNewCookie: false };
  }

  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded || realIp || '127.0.0.1';
  const ua = req.headers.get('user-agent') || 'default-agent';

  const hash = crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex').slice(0, 24);
  const newVid = `vid_${hash}`;
  return { visitorId: newVid, isNewCookie: true };
}

export function checkVisitorQuota(visitorId: string): { allowed: boolean; remaining: number } {
  const filePath = getQuotaFilePath();
  const store = loadStore(filePath);
  const record = store[visitorId];

  if (record && (record.status === 'reserved' || record.status === 'consumed')) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: 1 };
}

export async function reserveVisitorQuota(visitorId: string): Promise<{ success: boolean; error?: string }> {
  return withLock(() => {
    const filePath = getQuotaFilePath();
    const store = loadStore(filePath);
    const record = store[visitorId];

    if (record && (record.status === 'reserved' || record.status === 'consumed')) {
      return {
        success: false,
        error: 'Live scan limit reached. You are permitted only 1 live scan session to conserve SerpApi credits.',
      };
    }

    store[visitorId] = {
      status: 'reserved',
      reservedAt: Date.now(),
    };

    saveStoreAtomic(filePath, store);
    return { success: true };
  });
}

export async function commitVisitorQuota(
  visitorId: string,
  details?: { query?: string; claimText?: string }
): Promise<void> {
  return withLock(() => {
    const filePath = getQuotaFilePath();
    const store = loadStore(filePath);
    if (store[visitorId]) {
      store[visitorId].status = 'consumed';
      store[visitorId].consumedAt = Date.now();
      if (details) {
        store[visitorId].query = details.query;
        store[visitorId].claimText = details.claimText;
      }
      saveStoreAtomic(filePath, store);
    }
  });
}

export async function resetVisitorQuotaForTesting(visitorId?: string): Promise<void> {
  return withLock(() => {
    const filePath = getQuotaFilePath();
    if (visitorId) {
      const store = loadStore(filePath);
      delete store[visitorId];
      saveStoreAtomic(filePath, store);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
}
