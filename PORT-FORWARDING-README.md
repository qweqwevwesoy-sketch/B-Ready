# 🌐 Port Forwarding for Global Access

If tunneling services aren't working, use **router port forwarding** for direct global access.

## 📋 Steps:

### 1. Find Your Public IP
```
Go to: whatismyipaddress.com
Note: xxx.xxx.xxx.xxx (your public IP)
```

### 2. Configure Router Port Forwarding
- **Login to your router**: Usually 192.168.1.1 or 192.168.0.1
- **Go to Port Forwarding/Port Triggering**
- **Add rules:**

| External Port | Internal IP | Internal Port | Protocol |
|---------------|-------------|---------------|----------|
| 80 | Your PC IP | 3000 | TCP |
| 443 | Your PC IP | 3000 | TCP |
| 3001 | Your PC IP | 3001 | TCP |

### 3. Access Your App Globally
```
Frontend: http://YOUR_PUBLIC_IP
WebSocket: http://YOUR_PUBLIC_IP:3001
```

## ⚠️ Security Notes:
- Your PC must stay on and connected
- Public IP may change (use dynamic DNS)
- Consider firewall rules
- Not recommended for production

## 🔧 Dynamic DNS (for changing IPs)
- Services: No-IP, DynDNS, DuckDNS
- Get a domain name that points to your changing IP

## ✅ When to Use:
- Tunneling services failing
- Need direct access
- Learning/testing purposes
