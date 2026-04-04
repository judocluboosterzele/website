import path from "path";
import type { ImageMetadata } from "astro:assets";

const assetImports = import.meta.glob<{
  default: ImageMetadata;
}>("/src/assets/images/**/*.{jpeg,jpg,png,gif,webp}");

async function tryImportAsset(assetPath: string) {
  const importer = assetImports[assetPath];
  if (!importer) return null;

  const mod = await importer();
  return mod.default;
}

export async function resolveContentImage(
  raw: string | { src?: string } | null | undefined,
  baseFilePath?: string,
  baseFolder?: string,
): Promise<ImageMetadata | string | null> {
  if (!raw) return null;
  if (typeof raw !== "string") {
    return resolveContentImage(raw.src, baseFilePath, baseFolder);
  }

  const normalizedRaw = raw.trim();
  if (!normalizedRaw) return null;

  const candidatePaths = new Set<string>();

  if (normalizedRaw.startsWith("/src/")) {
    candidatePaths.add(normalizedRaw);
  }

  if (normalizedRaw.startsWith("/assets/")) {
    candidatePaths.add(`/src${normalizedRaw}`);
  }

  if (normalizedRaw.startsWith("src/")) {
    candidatePaths.add(`/${normalizedRaw}`);
  }

  if (normalizedRaw.startsWith("assets/")) {
    candidatePaths.add(`/src/${normalizedRaw}`);
  }

  if (!normalizedRaw.startsWith("/")) {
    if (baseFolder) {
      candidatePaths.add(`/src/assets/images/${baseFolder}/${normalizedRaw}`);
    } else {
      candidatePaths.add(
        `/src/assets/images/${normalizedRaw.replace(/^\/+/, "")}`,
      );
    }
  }

  if (baseFilePath) {
    const pageDir = path.posix.dirname(`/${baseFilePath}`);
    const resolvedPath = path.posix.normalize(
      path.posix.join(pageDir, normalizedRaw),
    );
    candidatePaths.add(resolvedPath);
  }

  for (const candidate of candidatePaths) {
    const imported = await tryImportAsset(candidate);
    if (imported) return imported;
  }

  return normalizedRaw;
}
