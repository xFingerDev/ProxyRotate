# ProxyRotate

**ProxyRotate** is a lightweight tool that redirects incoming HTTP requests through a rotating list of proxies. It supports basic authentication and environment-based configuration.

## 🚀 Features

- Supports multiple proxies defined via environment variables.
- Rotates requests across available proxies.
- Protects access using basic authentication.
- Easy to configure and run.

## 🔧 Configuration

Set the following environment variables before running the app:

```env
AUTH_USER="your_username"
AUTH_PASS="your_password"

# Proxies should be named sequentially: PROXY_0, PROXY_1, ..., PROXY_N
PROXY_0="http://proxy1.example.com"
PROXY_1="http://proxy2.example.com"
# Add as many as needed
