import { createWorker } from 'tesseract.js';

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

type PoolState = {
  idleWorkers: TesseractWorker[];
  totalWorkers: number;
  waiters: Array<(worker: TesseractWorker) => void>;
};

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const acquireTimeoutMs = parsePositiveInt(
  process.env.OCR_TESSERACT_POOL_ACQUIRE_TIMEOUT_MS,
  15_000,
);

const defaultPoolSize = parsePositiveInt(
  process.env.OCR_TESSERACT_POOL_SIZE,
  0,
);

const getMaxWorkersPerLanguage = (langs: string): number => {
  if (defaultPoolSize > 0) {
    return defaultPoolSize;
  }

  return langs === 'kor+eng' ? 2 : 1;
};

class TesseractWorkerPool {
  private readonly pools = new Map<string, PoolState>();

  private getPool(langs: string): PoolState {
    const existing = this.pools.get(langs);
    if (existing !== undefined) {
      return existing;
    }

    const created: PoolState = {
      idleWorkers: [],
      totalWorkers: 0,
      waiters: [],
    };
    this.pools.set(langs, created);
    return created;
  }

  async acquire(langs: string): Promise<TesseractWorker> {
    const pool = this.getPool(langs);
    const fromIdle = pool.idleWorkers.pop();
    if (fromIdle !== undefined) {
      return fromIdle;
    }

    const maxWorkers = getMaxWorkersPerLanguage(langs);
    if (pool.totalWorkers < maxWorkers) {
      pool.totalWorkers += 1;
      try {
        return await createWorker(langs);
      } catch (error) {
        pool.totalWorkers -= 1;
        throw error;
      }
    }

    return new Promise<TesseractWorker>((resolve, reject) => {
      const timeoutRef: { current: ReturnType<typeof setTimeout> | null } = {
        current: null,
      };

      const waiter = (worker: TesseractWorker) => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
        }
        resolve(worker);
      };

      timeoutRef.current = setTimeout(() => {
        const idx = pool.waiters.indexOf(waiter);
        if (idx >= 0) {
          pool.waiters.splice(idx, 1);
        }
        reject(
          new Error(
            `Tesseract worker acquire timeout (${acquireTimeoutMs}ms): ${langs}`,
          ),
        );
      }, acquireTimeoutMs);

      pool.waiters.push(waiter);
    });
  }

  release(langs: string, worker: TesseractWorker): void {
    const pool = this.getPool(langs);
    const waiter = pool.waiters.shift();
    if (waiter !== undefined) {
      waiter(worker);
      return;
    }

    pool.idleWorkers.push(worker);
  }
}

export const tesseractWorkerPool = new TesseractWorkerPool();
