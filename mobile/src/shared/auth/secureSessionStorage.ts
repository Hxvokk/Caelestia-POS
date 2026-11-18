import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const MAX_SECURE_VALUE_BYTES = 1500;

type Manifest = {
  version: string;
  chunks: number;
};

function utf8Chunks(value: string): string[] {
  const chunks: string[] = [];
  let chunk = "";
  let chunkBytes = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const bytes =
      codePoint <= 0x7f ? 1 :
      codePoint <= 0x7ff ? 2 :
      codePoint <= 0xffff ? 3 : 4;
    if (chunk && chunkBytes + bytes > MAX_SECURE_VALUE_BYTES) {
      chunks.push(chunk);
      chunk = "";
      chunkBytes = 0;
    }
    chunk += character;
    chunkBytes += bytes;
  }

  if (chunk || chunks.length === 0) chunks.push(chunk);
  return chunks;
}

function chunkKey(key: string, version: string, index: number): string {
  return `${key}.session.${version}.${index}`;
}

async function getManifest(key: string): Promise<Manifest | null> {
  const stored = await SecureStore.getItemAsync(`${key}.manifest`);
  if (!stored) return null;

  try {
    const manifest = JSON.parse(stored) as Manifest;
    if (
      typeof manifest.version !== "string" ||
      !Number.isInteger(manifest.chunks) ||
      manifest.chunks < 1 ||
      manifest.chunks > 100
    ) {
      return null;
    }
    return manifest;
  } catch {
    return null;
  }
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return globalThis.localStorage?.getItem(key) ?? null;
    }

    const manifest = await getManifest(key);
    if (!manifest) {
      // Read legacy unchunked values written before the manifest format.
      return SecureStore.getItemAsync(key);
    }

    const values = await Promise.all(
      Array.from({ length: manifest.chunks }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, manifest.version, index)),
      ),
    );
    if (values.some((value) => value === null)) return null;
    return values.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(key, value);
      return;
    }

    const previous = await getManifest(key);
    const chunks = utf8Chunks(value);
    const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    for (const [index, chunk] of chunks.entries()) {
      await SecureStore.setItemAsync(chunkKey(key, version, index), chunk);
    }
    await SecureStore.setItemAsync(
      `${key}.manifest`,
      JSON.stringify({ version, chunks: chunks.length } satisfies Manifest),
    );

    if (previous) {
      await Promise.all(
        Array.from({ length: previous.chunks }, (_, index) =>
          SecureStore.deleteItemAsync(chunkKey(key, previous.version, index)),
        ),
      );
    }
    await SecureStore.deleteItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(key);
      return;
    }

    const manifest = await getManifest(key);
    if (manifest) {
      await Promise.all(
        Array.from({ length: manifest.chunks }, (_, index) =>
          SecureStore.deleteItemAsync(chunkKey(key, manifest.version, index)),
        ),
      );
    }
    await SecureStore.deleteItemAsync(`${key}.manifest`);
    await SecureStore.deleteItemAsync(key);
  },
};
