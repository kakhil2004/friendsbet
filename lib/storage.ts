import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

// Simple in-memory lock to prevent concurrent writes
const locks: Record<string, Promise<void>> = {};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection: string): string {
  return join(DATA_DIR, `${collection}.json`);
}

export function readData<T>(collection: string): T[] {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, "[]", "utf-8");
    return [];
  }
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

export function writeData<T>(collection: string, data: T[]): void {
  ensureDataDir();
  const filePath = getFilePath(collection);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Locked read-modify-write to prevent race conditions
export async function withLock<T>(
  collection: string,
  fn: (data: T[]) => T[]
): Promise<T[]> {
  const execute = async (): Promise<T[]> => {
    const data = readData<T>(collection);
    const updated = fn(data);
    writeData(collection, updated);
    return updated;
  };

  // Chain on existing lock if present
  const prev = locks[collection] || Promise.resolve();
  let resolve: () => void;
  locks[collection] = new Promise<void>((r) => {
    resolve = r;
  });

  await prev;
  try {
    return await execute();
  } finally {
    resolve!();
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
