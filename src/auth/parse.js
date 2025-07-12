export function parseAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const base64 = header.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString();
    const [user, pass] = decoded.split(":");
    return { user, pass };
  } catch {
    return null;
  }
}
