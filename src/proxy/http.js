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
      clientSocket.end();
    }, 10000);

    proxySocket.on("error", (e) => {
      clearTimeout(timer);
      err(e);
    });
    let responseBuffer = "";
    proxySocket.once("data", (chunk) => {
      responseBuffer += chunk.toString();

      if (responseBuffer.includes("\r\n\r\n")) {
        clearTimeout(timer);
        proxySocket.removeListener("data", onData);

        if (/^HTTP\/1\.\d 200/.test(responseBuffer)) {
          clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          clientSocket.pipe(proxySocket);
          proxySocket.pipe(clientSocket);
        } else {
          clientSocket.write(responseBuffer);
          clientSocket.end();
          proxySocket.end();
        }
      }
    });
  } catch (e) {
    err(e);
  }
}
