import { middlewareProxyHttp } from "./proxy/http.js";
import { middlewareProxySocks } from "./proxy/socks.js";
export async function middlewareProxy(proxy, req, clientSocket, err) {
  if (proxy.protocol.includes("http")) {
    return await middlewareProxyHttp(proxy, req, clientSocket, err);
  }

  if (proxy.protocol.includes("socks")) {
    return await middlewareProxySocks(proxy, req, clientSocket, err);
  }

  return clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
}
