const assetImports = import.meta.glob<{ default: any }>(
  "/src/assets/images/**/*.{jpeg,jpg,png,gif,webp}",
  { eager: true },
);

export function resolveContentImage(
  filename: string | null | undefined,
  folder: string,
): any | null {
  if (!filename) return null;

  const name = filename.trim();

  // Already a full /src/assets/... path
  if (name.includes("/src/assets/")) {
    const key = "/src/assets/" + name.split("/src/assets/")[1];
    return assetImports[key]?.default ?? null;
  }

  // Old-style relative path with ../ — extract the assets/images/ part
  if (name.includes("assets/images/")) {
    const key = "/src/assets/images/" + name.split("assets/images/")[1];
    return assetImports[key]?.default ?? null;
  }

  const clean = name.replace(/^\/+/, "");

  // Has subfolders — try directly under /src/assets/images/ first
  if (clean.includes("/")) {
    const key = `/src/assets/images/${clean}`;
    return assetImports[key]?.default ?? null;
  }

  // Bare filename — try page folder first, then root
  const key = `/src/assets/images/${folder}/${clean}`;
  if (assetImports[key]) return assetImports[key].default;

  const rootKey = `/src/assets/images/${clean}`;
  return assetImports[rootKey]?.default ?? null;
}
