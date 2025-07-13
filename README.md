# ProxyRotate

**ProxyRotate** is a lightweight tool that redirects incoming HTTP requests through a rotating list of proxies. It supports basic authentication, environment-based configuration, and Discord webhook alerts.

## 🚀 Features

- Supports multiple proxies defined via environment variables.
- Rotates requests across available proxies.
- Protects access using basic authentication.
- Sends alerts via Discord webhooks on errors.
- Easy to configure and run.

## 🔧 Configuration

Set the following environment variables before running the app:

```env
AUTH_USER="your_username"
AUTH_PASS="your_password"

# Proxies should be named sequentially: PROXY_0, PROXY_1, ..., PROXY_N
PROXY_0="http://user:password@proxy1.example.com:80"
PROXY_1="http://user:password@proxy3.example.com:80"
# Add as many as needed

# Optional: Discord webhook for alert notifications
WEBHOOK_DISCORD="https://discord.com/api/webhooks/..."
