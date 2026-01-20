export function getPublicEnv() {
  return Object.keys(process.env).reduce((acc, key) => {
    if (
      key.startsWith("PUBLIC_") ||
      key.includes("_PUBLIC_") ||
      key.startsWith("NEXT_PUBLIC_") ||
      key.startsWith("VITE_") ||
      key.startsWith("REACT_APP_") ||
      key.startsWith("BETTER_AUTH_")
    ) {
      acc[key] = process.env[key];
    }
    return acc;
  }, {} as Record<string, string | undefined>);
}
