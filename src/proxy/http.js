import * as net from "net";
export async function middlewareProxyHttp(proxy, req, clientSocket, err) {
  const [targetHost, targetPort] = req.url.split(":");
  var timer;
  try {
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

    timer = setTimeout(function () {
      err("No proxy works");

      //clientSocket.end();
    }, 10000);

    proxySocket.on("error", (e) => {
      clearTimeout(timer);
      err(e);
    });
    proxySocket.once("data", (chunk) => {
      const result = chunk.toString();
      if (result.includes("200")) {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        clientSocket.pipe(proxySocket);
        proxySocket.pipe(clientSocket);
      } else {
        //clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        proxySocket.end();
        err(result);
      }
      clearTimeout(timer);
    });
  } catch (e) {
    err(e);
  }
}
