import * as http from "http";
import { PROXIES } from "./config.js";

import { validateAuth } from "./auth/validate.js";
import { middlewareProxy } from "./middleware.js";
import { process } from "./proxy/process.js";
import { sendWebHook } from "./webhook/send.js";
let proxyIndex = 0;

let processedProxies = process(PROXIES);
let maxAttempts = processedProxies.length;

const proxyErrorMap = new Map();

function getNextProxy() {
  if (processedProxies.length === 0) return null;

  const now = Date.now();
  let attempts = 0;

  while (attempts < processedProxies.length) {
    proxyIndex = (proxyIndex + 1) % processedProxies.length;
    const proxy = processedProxies[proxyIndex];
    const key = `${proxy.protocol}:${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;

    const errorTime = proxyErrorMap.get(key);
    if (!errorTime || now - errorTime > 30 * 60 * 1000) {
      return proxy;
    }
    attempts++;
  }
  return null;
}

function markProxyError(proxy) {
  const key = `${proxy.protocol}:${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
  proxyErrorMap.set(key, Date.now());
}

export function loadServer(port) {
  const server = http.createServer();

  server.on("connect", async (req, clientSocket, head) => {
    if (!validateAuth(req.headers?.["proxy-authorization"] ?? "")) {
      return clientSocket.end("Proxy authentication required");
    }

    let attempts = 0;
    function runProxy() {
      const proxy = getNextProxy();
      if (!proxy) {
        clientSocket.end("HTTP/1.1 503 No Proxies Available\r\n\r\n");
        return;
      }
      try {
        middlewareProxy(proxy, req, clientSocket, (err) => {
          markProxyError(proxy);
          sendWebHook(
            `${attempts} - ${err?.message ?? err} | ${proxy.protocol}:${
              proxy.host
            }`
          );

          if (err && attempts < maxAttempts) {
            attempts++;
            runProxy();
          } else if (err) {
            clientSocket.end("HTTP/1.1 503 No Proxies Available\r\n\r\n");
          }
        });
      } catch (err) {
        markProxyError(proxy);
        sendWebHook(
          `[CATCH] - ${attempts} - ${err?.message ?? err} | ${proxy.protocol}:${
            proxy.host
          }`
        );
        if (err && attempts < maxAttempts) {
          attempts++;
          runProxy();
        } else if (err) {
          clientSocket.end("HTTP/1.1 503 No Proxies Available\r\n\r\n");
        }
      }
    }

    runProxy();
  });

  server.listen(port, () => {
    console.log(`🚀 Proxy runing in port ${port}`);
  });
}
