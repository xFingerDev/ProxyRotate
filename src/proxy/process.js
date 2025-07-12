export function process(proxies) {
  return proxies.map((proxy) => {
    //TODO: HANDLE CORRECT URL ONLY WORKS http://user:password@ip:port

    const [protocol, proxyUrl] = proxy.split("://");
    const [authProxy, ipProxy] = proxyUrl.split("@");
    const [hostname, port] = ipProxy.split(":");
    const [username, password] = authProxy.split(":");
    return {
      protocol: protocol,
      host: hostname,
      port: parseInt(port),
      username: username,
      password: password,
    };
  });
}
