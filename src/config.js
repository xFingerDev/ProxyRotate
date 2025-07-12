const CONFIG = Object.freeze({
  AUTH_USER: process.env.AUTH_USER ?? "admin",
  AUTH_PASS: process.env.AUTH_PASS ?? "    -    ",
  WEBHOOK_DISCORD: process.env.WEBHOOK_DISCORD ?? null,
  PORT: Number(process.env.PORT ?? 3121),
  PROXIES: Object.keys(process.env)
    .filter((env) => env.toUpperCase().includes("PROXY"))
    .map((key) => process.env[key] ?? "")
    .filter(Boolean),
});

export const AUTH_USER = CONFIG.AUTH_USER;
export const AUTH_PASS = CONFIG.AUTH_PASS;
export const WEBHOOK_DISCORD = CONFIG.WEBHOOK_DISCORD;
export const PROXIES = CONFIG.PROXIES;
export const PORT = CONFIG.PORT;
