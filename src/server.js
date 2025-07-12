import * as http from "http";
import { PROXIES } from "./config.js";

import { validateAuth } from "./auth/validate.js";
import { middlewareProxy } from "./middleware.js";
import { process } from "./proxy/process.js";
let proxyIndex = 0;

let processedProxies = process(PROXIES);
let maxAttempts = Math.min(processedProxies.length, 5);

function getNextProxy() {
  if (processedProxies.length === 0) return null;
  proxyIndex = (proxyIndex + 1) % processedProxies.length;
  return processedProxies[proxyIndex];
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
      middlewareProxy(proxy, req, clientSocket, (err) => {
        if (err && attempts < maxAttempts) {
          attempts++;
          runProxy();
        } else if (err) {
          clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        }
      });
    }

    runProxy();
  });

  server.listen(port, () => {
    console.log(`🚀 Proxy runing in port ${port}`);
  });
}
