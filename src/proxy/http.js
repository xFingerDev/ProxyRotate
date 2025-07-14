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
    proxySocket.on("data", (chunk) => {
      responseBuffer += chunk.toString();
      if (responseBuffer.indexOf("\r\n\r\n") !== -1) {
        // Headers received, check for 200 Connection established
        if (/^HTTP\/1\.\d 200/.test(responseBuffer)) {
          clientSocket.pipe(proxySocket);
          proxySocket.pipe(clientSocket);
        } else {
          clientSocket.end();
        }
        clearTimeout(timer);
        proxySocket.removeAllListeners("data");
      }
    });
  } catch (e) {
    err(e);
  }
}
