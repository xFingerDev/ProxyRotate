import * as http from "http";
import * as net from "net";
import { SocksClient } from "socks";

const AUTH_USER = process.env.AUTH_USER ?? "admin";
const AUTH_PASS = process.env.AUTH_PASS ?? "    -    ";

let proxies = [];
Object.keys(process.env).forEach((d) => {
  if (d.toUpperCase().includes("PROXY")) {
    proxies.push(process.env[d]);
  }
});

let proxyIndex = 0;

let processedProxies = [];

proxies.forEach((proxyUrl) => {
  const parsed = new URL(proxyUrl);
  processedProxies.push({
    protocol: parsed.protocol.replace(":", ""),
    host: parsed.hostname,
    port: parseInt(parsed.port),
    username: parsed.username,
    password: parsed.password,
  });
});

function getNextProxy() {
  if (processedProxies.length === 0) return null;
  proxyIndex = (proxyIndex + 1) % processedProxies.length;
  return processedProxies[proxyIndex];
}

function parseProxyAuth(header) {
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

const server = http.createServer();

server.on("connect", async (req, clientSocket, head) => {
  const [targetHost, targetPort] = req.url.split(":");

  const authHeader = req.headers?.["proxy-authorization"] ?? "";
  const credentials = parseProxyAuth(authHeader);
  if (
    !credentials ||
    credentials.user !== AUTH_USER ||
    credentials.pass !== AUTH_PASS
  ) {
    return clientSocket.end("Proxy authentication required");
  }

  const proxy = getNextProxy();
  if (!proxy) {
    clientSocket.end("HTTP/1.1 503 No Proxies Available\r\n\r\n");
    return;
  }

  if (proxy.protocol === "http") {
    const auth = Buffer.from(`${proxy.username}:${proxy.password}`).toString(
      "base64"
    );
    const proxySocket = net.connect(proxy.port, proxy.host, () => {
      proxySocket.write(
        `CONNECT ${req.url} HTTP/1.1\r\n` +
          `Host: ${targetHost}\r\n` +
          `Proxy-Authorization: Basic ${auth}\r\n\r\n`
      );
    });

    proxySocket.once("data", (chunk) => {
      if (chunk.toString().includes("200")) {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        clientSocket.pipe(proxySocket);
        proxySocket.pipe(clientSocket);
      } else {
        clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        proxySocket.end();
      }
    });

    proxySocket.on("error", (err) => {
      clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
    });
  } else if (proxy.protocol === "socks5") {
    let socksError = false;
    let attemptCount = 0;
    let maxAttempts = processedProxies.length;
    let proxySocket = null;

    while (attemptCount < maxAttempts) {
      try {
        const currentProxy = getNextProxy();
        if (!currentProxy) break;
        const { socket } = await SocksClient.createConnection({
          command: "connect",
          proxy: {
            host: currentProxy.host,
            port: currentProxy.port,
            type: 5,
            userId: currentProxy.username,
            password: currentProxy.password,
          },
          destination: {
            host: targetHost,
            port: parseInt(targetPort),
          },
        });
        proxySocket = socket;
        socksError = false;
        break;
      } catch (err) {
        if (
          err.message &&
          err.message.includes("Socks5 Authentication failed")
        ) {
          socksError = true;
          attemptCount++;
          continue;
        } else {
          clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
          return;
        }
      }
    }

    if (proxySocket && !socksError) {
      clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      clientSocket.pipe(proxySocket);
      proxySocket.pipe(clientSocket);
    } else {
      clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
    }
  } else {
    clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
  }
});

server.listen(3121, () => {
  console.log("🚀 Proxy runing in port 3121");
});
