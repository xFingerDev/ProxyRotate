import { SocksClient } from "socks";

export async function middlewareProxySocks(proxy, req, clientSocket, err) {
  const [targetHost, targetPort] = req.url.split(":");
  try {
    const { socket: proxySocket } = await SocksClient.createConnection({
      command: "connect",
      proxy: {
        host: proxy.host,
        port: proxy.port,
        type: Number(proxy.protocol.replace("socks", "")),
        userId: proxy.username,
        password: proxy.password,
      },
      destination: {
        host: targetHost,
        port: parseInt(targetPort),
      },
    });

    proxySocket.on("error", err);
    clientSocket.on("close", () => {
      setTimeout(() => proxySocket.destroy(), 500);
    });
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    clientSocket.pipe(proxySocket);
    proxySocket.pipe(clientSocket);
  } catch (e) {
    err(e);
  }
}
