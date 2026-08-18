# ISG eSolutions Console

Production and deployment guide for the ISG eSolutions IT inventory application.

The application is a React/Vite single-page application with an Express API and a SQLite database. It supports laptop, employee, vendor, issue, reporting, import/export, backup, audit, user, and settings workflows. The dashboard reads inventory totals and purchase data from SQLite, including Indian Rupee formatting and purchase-cost-by-year calculations.

## Contents

- [Application Profile](#application-profile)
- [Repository Layout](#repository-layout)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Domain, DNS, and HTTPS](#domain-dns-and-https)
- [Deployment Prerequisites](#deployment-prerequisites)
- [Windows Server Deployment](#windows-server-deployment)
- [Linux/Ubuntu Deployment](#linuxubuntu-deployment)
- [Docker Deployment](#docker-deployment)
- [Database, Migration, and Seed Behavior](#database-migration-and-seed-behavior)
- [Backup and Restore](#backup-and-restore)
- [Updates and Rollback](#updates-and-rollback)
- [Production Security](#production-security)
- [Monitoring and Logs](#monitoring-and-logs)
- [Post-Deployment Testing](#post-deployment-testing)
- [Troubleshooting](#troubleshooting)
- [Deployment Checklist](#deployment-checklist)
- [Quick Deployment Guide](#quick-deployment-guide)

## Application Profile

The following values are taken from the project files, not assumed from a generic template.

| Area | Implementation | Project evidence | Production note |
| --- | --- | --- | --- |
| Frontend | React 19 with Vite 8 | `frontend/package.json`, `frontend/vite.config.js` | Build the app and serve `frontend/dist` with IIS, Nginx, or the included frontend container. |
| Backend | Express 5 on Node.js | `backend/package.json`, `backend/index.js` | Start with `node index.js` or `npm start` from `backend`. |
| Runtime Node version | Node.js 24.x validated in this workspace | `node --version` returned `v24.15.0` | Use Node 24 LTS/current release where available. Node 20+ is the practical minimum for the current dependency tree. |
| npm version | npm 11.x validated in this workspace | `npm --version` returned `11.12.1` | Use the npm version bundled with Node 24 or newer. |
| Database | SQLite through `better-sqlite3` | `backend/db.js`, `backend/init-db.js` | Use a persistent disk. SQLite is appropriate for a single application server, not a multi-writer cluster. |
| Database setup | Idempotent JavaScript initializer | `backend/init-db.js` | Run `npm run db:init` before first start. `index.js` also runs the initializer during startup. |
| Prisma | Present but not the runtime data layer | `backend/prisma/schema.prisma` | There are no Prisma models or migration files. Do not use `prisma migrate` for this application. |
| Authentication | JWT bearer tokens with bcrypt password hashes | `backend/controllers/auth.controller.js`, `backend/middleware/auth.middleware.js` | Store a strong `JWT_SECRET` outside source control. |
| API base URL | Vite build-time variable with `/api` default | `frontend/src/App.jsx`, `frontend/vite.config.js` | Use `/api` behind a reverse proxy. Set a full URL only when frontend and API are hosted separately. |
| File handling | Browser CSV import, browser CSV download, print-ready PDF export, filesystem SQLite backups | `frontend/src/App.jsx`, `backend/routes/backup.routes.js` | Back up the database file and the backend `backups` directory. |
| Frontend build | `npm run build` | `frontend/package.json` | Output is `frontend/dist`. |
| Backend production start | `npm start` or `node index.js` | `backend/package.json` | Run it under NSSM, systemd, Docker, or another process supervisor. |
| API port | `5000` by default | `backend/index.js` | Keep it internal or bound to loopback behind a reverse proxy. |
| Vite development port | `5173` by default | `frontend/package.json` | Development only; do not expose it as a production web server. |
| Production web ports | `80` and `443` | IIS/Nginx/reverse proxy | Expose only HTTPS publicly after TLS is configured. |

### Supported commands

Run frontend commands from `frontend`:

```bash
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

Run backend commands from `backend`:

```bash
npm ci
npm run db:init
npm start
```

There is currently no automated test script beyond the placeholder `npm test` command. Use the smoke tests in [Post-Deployment Testing](#post-deployment-testing) as the deployment acceptance test.

## Repository Layout

```text
IT Inventory/
|-- backend/
|   |-- controllers/       Authentication controllers
|   |-- middleware/        Authentication and request security middleware
|   |-- routes/            API routes
|   |-- backups/           Runtime backup files, created when used
|   |-- dev.db             SQLite database, ignored by Git
|   |-- index.js            Express entry point
|   |-- init-db.js         Schema creation and first-run seed
|   |-- db.js              Shared SQLite connection
|   |-- Dockerfile
|   |-- package.json
|   `-- .env               Local/private backend configuration, not committed
|-- frontend/
|   |-- public/             Static assets and IIS web.config
|   |-- src/                React application and styles
|   |-- Dockerfile
|   |-- nginx.conf          Container web server and API proxy
|   |-- vite.config.js
|   `-- package.json
|-- docker-compose.yml
|-- .dockerignore
|-- .env.example
`-- README.md
```

## Configuration

### Backend environment variables

Create `backend/.env` on a traditional server. Do not commit it.

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_PATH=C:/ProgramData/ISG/Inventory/data/inventory.db
DATABASE_URL=file:./dev.db
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://inventory.example.com
```

On Linux, use a Linux path:

```dotenv
DATABASE_PATH=/var/lib/isg-inventory/inventory.db
```

`DATABASE_PATH` is the runtime database setting used by Express and the backup routes. `DATABASE_URL` is retained for the Prisma configuration but is not used by the current Express/SQLite runtime.

The backend loads `backend/.env` through `dotenv`. Environment variables supplied by the operating system or Docker take precedence over the file.

### Frontend build-time environment variables

The frontend is compiled by Vite, so its environment is fixed at build time.

For a reverse-proxied deployment where the frontend and API share one hostname:

```dotenv
VITE_API_BASE_URL=/api
```

For separate hosts:

```dotenv
VITE_API_BASE_URL=https://api.inventory.example.com/api
```

The default is `/api`. Vite development mode proxies `/api` to `http://localhost:5000` using `frontend/vite.config.js`.

### Authentication defaults

On an empty database, `init-db.js` creates:

```text
Email:    admin@example.com
Password: admin123
Role:     ADMIN
```

This is a development/bootstrap credential only. Change or remove it before exposing the application to users. The current application includes a registration endpoint at `/api/auth/register`; protect or disable public registration before internet-facing production use if self-registration is not required.

## Architecture

### Traditional server architecture

```text
User browser
    |
    | HTTPS 443
    v
IIS or Nginx reverse proxy
    |------------------------------|
    |                              |
    | static files                 | /api/* proxy
    v                              v
React/Vite dist                  Express API :5000
                                       |
                                       v
                              SQLite database file
```

### Docker architecture

```text
User browser
    |
    | HTTPS 443
    v
External IIS/Nginx/managed load balancer
    |
    | HTTP to 127.0.0.1:8080
    v
Frontend container :80
    |
    | internal Docker network, /api/*
    v
Backend container :5000
    |
    v
Persistent SQLite volume /app/data/inventory.db
```

### Port exposure policy

| Port | Purpose | Public? |
| --- | --- | --- |
| `80` | HTTP redirect or local web serving | Only through the reverse proxy; redirect to HTTPS in production. |
| `443` | HTTPS | Yes. |
| `5000` | Express API | No. Bind to loopback or Docker internal network. |
| `5173` | Vite development server | No. Development only. |
| `8080` | Host port for the Docker frontend in the included Compose file | Bind to `127.0.0.1` when an external reverse proxy is used. |
| `22` | SSH on Linux | Restrict to administrator/VPN IP ranges. |

## Domain, DNS, and HTTPS

Use a dedicated hostname such as `inventory.example.com`.

1. Create an `A` record for `inventory.example.com` pointing to the public IP of the reverse proxy/server.
2. Create an `AAAA` record only when IPv6 is configured and firewalled correctly.
3. Confirm DNS before requesting a certificate:

```bash
nslookup inventory.example.com
dig +short inventory.example.com
```

4. Permit TCP 80 for certificate issuance and HTTP-to-HTTPS redirects.
5. Permit TCP 443 for application traffic.
6. Keep API port 5000 and development port 5173 private.
7. Set `CORS_ORIGIN=https://inventory.example.com` and rebuild/restart after changing the public hostname.

### Windows certificate setup

For a public certificate on IIS, use an enterprise certificate process or a tool such as win-acme:

1. Install win-acme on the IIS server.
2. Run `wacs.exe` as Administrator.
3. Select the IIS site and the `inventory.example.com` binding.
4. Allow win-acme to create the HTTPS binding and scheduled renewal task.
5. Verify the certificate is in the Local Computer certificate store and that IIS has the 443 binding.

### Linux certificate setup

Use Certbot after the Nginx HTTP site responds correctly:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d inventory.example.com
sudo certbot renew --dry-run
```

### Docker certificate setup

Terminate TLS in a host-level Nginx/IIS/load balancer and proxy to the frontend host port, normally `127.0.0.1:8080`. The included frontend container is intentionally an HTTP service inside the private deployment boundary.

## Deployment Prerequisites

### Recommended production server

For a small or medium single-server installation:

- 2 vCPU minimum; 4 vCPU recommended.
- 4 GB RAM minimum; 8 GB recommended if building on the server or running Docker.
- 20 GB free disk minimum, plus backup retention capacity.
- SSD storage for SQLite and backups.
- Static private IP and a public DNS name for internet access.
- Automated time synchronization.
- Firewall capability and an administrator account.
- A backup destination separate from the application disk.

SQLite is a file database. Do not put the database on a network filesystem or run multiple backend replicas writing to the same file. For high availability or multiple API replicas, plan a separate database migration before scaling horizontally.

### Required software

Install the following on a traditional server:

- Node.js 24.x.
- npm 11.x or the version bundled with Node.js 24.
- Git.
- Native build tooling for `better-sqlite3` and `bcrypt` if npm cannot use prebuilt binaries.
- IIS plus URL Rewrite and ARR on Windows.
- Nginx and Certbot on Ubuntu/Linux.
- Docker Engine and the Compose plugin for Docker production.

## Windows Server Deployment

The recommended Windows layout is IIS serving the Vite build and a Windows service running the Express API.

### 1. Install Windows components

Open PowerShell as Administrator:

```powershell
Install-WindowsFeature Web-Server,Web-Common-Http,Web-Default-Doc,Web-Static-Content,Web-Http-Logging,Web-Request-Monitor,Web-Filtering -IncludeManagementTools
```

Install these separately from their official installers:

- Node.js 24.x LTS/current Windows installer.
- Git for Windows.
- IIS URL Rewrite module.
- IIS Application Request Routing (ARR).
- NSSM (Non-Sucking Service Manager) or another Windows service manager.
- Visual Studio Build Tools with the Desktop C++ workload and Python if `npm ci` needs to compile native modules.

After installing Node.js, open a new PowerShell window and verify:

```powershell
node --version
npm --version
git --version
```

Use Node 24.x and npm 11.x or newer. A Node version lower than 20 is not supported by the current dependency tree.

### 2. Create the application directories

```powershell
New-Item -ItemType Directory -Force -Path 'C:\ProgramData\ISG\Inventory\data' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\ProgramData\ISG\Inventory\backups' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\Sites\ISGInventory' | Out-Null
```

### 3. Get the source code

```powershell
Set-Location 'C:\Sites'
git clone <repository-url> ISGInventory
Set-Location 'C:\Sites\ISGInventory'
git checkout <release-or-branch>
```

If Git is not permitted on the production server, copy the release archive to `C:\Sites\ISGInventory` and verify that `backend/package-lock.json` and `frontend/package-lock.json` are present.

### 4. Configure the backend

```powershell
Copy-Item '.env.example' 'backend\.env'
notepad 'backend\.env'
```

Set at least:

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_PATH=C:/ProgramData/ISG/Inventory/data/inventory.db
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://inventory.example.com
```

Use forward slashes in `DATABASE_PATH` or escape Windows backslashes. Grant the eventual service account Modify permission on:

- `C:\ProgramData\ISG\Inventory\data`
- `C:\ProgramData\ISG\Inventory\backups`

### 5. Install backend dependencies and initialize SQLite

```powershell
Set-Location 'C:\Sites\ISGInventory\backend'
npm ci
npm run db:init
```

The initializer creates the tables and seeds the bootstrap administrator and demo India inventory only when the inventory tables are empty. It is safe to run again; it does not overwrite existing records.

Test the API directly before configuring IIS:

```powershell
npm start
```

In another PowerShell window:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/api/health
```

Stop the foreground process with `Ctrl+C` after the test.

### 6. Build the frontend

The default `/api` value is correct when IIS proxies `/api` to port 5000.

```powershell
Set-Location 'C:\Sites\ISGInventory\frontend'
npm ci
$env:VITE_API_BASE_URL = '/api'
npm run lint
npm run build
```

The deployable static files are in `C:\Sites\ISGInventory\frontend\dist`. Vite copies `frontend/public/web.config` into `dist` automatically.

### 7. Run the backend as a Windows service

NSSM example:

```powershell
nssm install ISGInventoryAPI 'C:\Program Files\nodejs\node.exe' 'C:\Sites\ISGInventory\backend\index.js'
nssm set ISGInventoryAPI AppDirectory 'C:\Sites\ISGInventory\backend'
nssm set ISGInventoryAPI DisplayName 'ISG eSolutions Inventory API'
nssm set ISGInventoryAPI Start SERVICE_AUTO_START
nssm set ISGInventoryAPI AppStdout 'C:\ProgramData\ISG\Inventory\api-stdout.log'
nssm set ISGInventoryAPI AppStderr 'C:\ProgramData\ISG\Inventory\api-stderr.log'
nssm start ISGInventoryAPI
```

Verify the service and API:

```powershell
Get-Service ISGInventoryAPI
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/api/health
```

Do not use the repository `backend/start.bat` unchanged on another server; it contains a machine-specific absolute path. Use `npm start` or the service configuration above.

### 8. Configure IIS

1. Open IIS Manager.
2. Install URL Rewrite and ARR.
3. Enable ARR proxying in IIS Manager under the server node, **Application Request Routing Cache**, **Server Proxy Settings**, then enable **Proxy**.
4. Create a site whose physical path is `C:\Sites\ISGInventory\frontend\dist`.
5. Add an HTTP binding for initial testing.
6. The included `web.config` performs two operations:
   - Proxies `/api/*` to `http://127.0.0.1:5000/api/*`.
   - Falls back non-file routes to `index.html` for React navigation.
7. Add the HTTPS binding after the certificate is installed.

The IIS site must be able to read `frontend/dist`. The backend service account must be able to write the database and backup directories.

### 9. Windows firewall

Only publish IIS ports. Keep the API bound to loopback and do not add a public rule for 5000.

```powershell
New-NetFirewallRule -DisplayName 'ISG Inventory HTTPS' -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName 'ISG Inventory HTTP' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

Restrict RDP to a management network. Do not expose port 5173.

## Linux/Ubuntu Deployment

The recommended Linux layout is Nginx serving `frontend/dist` and systemd running the API on loopback.

### 1. Install packages

```bash
sudo apt update
sudo apt install -y ca-certificates curl git build-essential python3 nginx ufw
```

Install Node.js 24.x:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

If `better-sqlite3` or `bcrypt` compilation fails, confirm `build-essential` and `python3` are installed, then remove `node_modules` and rerun `npm ci`.

### 2. Create a service account and directories

```bash
sudo useradd --system --home /srv/isg-inventory --shell /usr/sbin/nologin isginventory || true
sudo mkdir -p /srv/isg-inventory /var/lib/isg-inventory /var/backups/isg-inventory
sudo chown -R isginventory:isginventory /srv/isg-inventory /var/lib/isg-inventory /var/backups/isg-inventory
```

### 3. Get the source

```bash
sudo git clone <repository-url> /srv/isg-inventory
sudo chown -R isginventory:isginventory /srv/isg-inventory
cd /srv/isg-inventory
sudo git checkout <release-or-branch>
```

### 4. Configure and initialize the backend

```bash
sudo -u isginventory cp .env.example backend/.env
sudo -u isginventory nano backend/.env
```

Use:

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_PATH=/var/lib/isg-inventory/inventory.db
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://inventory.example.com
```

Install and initialize:

```bash
cd /srv/isg-inventory/backend
sudo -u isginventory npm ci
sudo -u isginventory npm run db:init
```

### 5. Build the frontend

```bash
cd /srv/isg-inventory/frontend
sudo -u isginventory npm ci
sudo -u isginventory env VITE_API_BASE_URL=/api npm run build
```

### 6. Create a systemd service

Create `/etc/systemd/system/isg-inventory-api.service`:

```ini
[Unit]
Description=ISG eSolutions Inventory API
After=network.target

[Service]
Type=simple
User=isginventory
Group=isginventory
WorkingDirectory=/srv/isg-inventory/backend
EnvironmentFile=/srv/isg-inventory/backend/.env
ExecStart=/usr/bin/node /srv/isg-inventory/backend/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/var/lib/isg-inventory /var/backups/isg-inventory

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now isg-inventory-api
sudo systemctl status isg-inventory-api
curl --fail http://127.0.0.1:5000/api/health
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/isg-inventory`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name inventory.example.com;

    root /srv/isg-inventory/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/isg-inventory /etc/nginx/sites-enabled/isg-inventory
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Linux firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Do not allow public port 5000. The service listens for Nginx through `127.0.0.1`.

### 9. HTTPS with Let's Encrypt

After DNS points to the server and HTTP works:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d inventory.example.com
sudo certbot renew --dry-run
```

Certbot updates the Nginx server block and installs automatic renewal. Verify the browser redirects to HTTPS and `CORS_ORIGIN` exactly matches the HTTPS origin.

## Docker Deployment

The repository includes:

- `backend/Dockerfile` for the Express API.
- `frontend/Dockerfile` for a Vite build served by Nginx.
- `frontend/nginx.conf` for SPA fallback and internal `/api` proxying.
- `docker-compose.yml` for the frontend, backend, private network, health checks, and persistent volumes.
- `.dockerignore` files for smaller and safer build contexts.

SQLite is intentionally not a third container. The backend owns the SQLite file in a persistent volume. A separate database container is not required or appropriate for this single-writer SQLite design.

### Docker installation on Ubuntu/Linux

Install Docker Engine and Compose from Docker's official repository. The following is the standard convenience installation for a new non-production test host:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
docker version
docker compose version
```

For a regulated production server, use the official Docker Engine repository and pin a supported Docker release instead of relying on a convenience script.

### Docker installation on Windows Server

Docker Desktop is intended for developer workstations and is not the recommended production runtime for Windows Server. Choose one of these supported operational models:

1. Run the included Linux containers inside an Ubuntu VM on Windows Server and install Docker Engine in that VM. This is the simplest and most compatible option.
2. Use Mirantis Container Runtime/Windows Server container infrastructure according to the Windows Server version and organizational licensing. The included images are Linux images, so confirm Linux-container support before using this path.
3. Use Docker Desktop only for development or a controlled non-production Windows workstation with WSL 2 enabled.

For Docker Desktop development:

1. Install Docker Desktop.
2. Enable the WSL 2 backend.
3. Start Docker Desktop and verify:

```powershell
docker version
docker compose version
```

4. Keep the repository in a location shared with Docker Desktop.

### Create Docker environment variables

From the repository root:

```bash
cp .env.example .env.docker
```

PowerShell:

```powershell
Copy-Item .env.example .env.docker
```

Edit `.env.docker`:

```dotenv
JWT_SECRET=replace-with-a-long-random-production-secret
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://inventory.example.com
VITE_API_BASE_URL=/api
FRONTEND_PORT=8080
```

`.env.docker` is private and must not be committed. Compose fails if `JWT_SECRET` is missing.

### Build and start the stack

```bash
docker compose --env-file .env.docker config
docker compose --env-file .env.docker up -d --build
```

The first start creates the schema and seed data in the backend volume. Open `http://localhost:8080` for a direct local test. In production, bind the host port to loopback and put HTTPS Nginx/IIS in front of it.

PowerShell uses the same commands:

```powershell
docker compose --env-file .env.docker config
docker compose --env-file .env.docker up -d --build
```

### Docker operations

View service status:

```bash
docker compose ps
docker compose ps --all
```

View logs:

```bash
docker compose logs --tail=200 backend
docker compose logs --follow backend
docker compose logs --follow frontend
```

Stop without deleting volumes:

```bash
docker compose stop
```

Start existing containers:

```bash
docker compose start
```

Restart:

```bash
docker compose restart backend frontend
```

Stop and remove containers/network while keeping named volumes:

```bash
docker compose down
```

Never add `--volumes` to `docker compose down` unless the database and backup volumes have been backed up and you intentionally want to destroy them.

### Docker production reverse proxy

The frontend container listens on port 80 internally and proxies `/api` to the backend service on the private Compose network. To put an external Nginx instance in front of the stack, publish the frontend only on loopback in `docker-compose.yml`:

```yaml
ports:
  - "127.0.0.1:${FRONTEND_PORT:-8080}:80"
```

Then use:

```nginx
server {
    listen 443 ssl http2;
    server_name inventory.example.com;

    ssl_certificate /etc/letsencrypt/live/inventory.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inventory.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The internal frontend Nginx still sends `/api` requests to `backend:5000`. Do not expose port 5000 on the host.

### Rebuild after a release

```bash
git pull --ff-only
docker compose --env-file .env.docker up -d --build
docker compose ps
docker compose logs --tail=100 backend
```

The backend initializer is idempotent. Back up the volumes before upgrades that change database columns or seed behavior.

Remove unused build cache safely:

```bash
docker image prune
docker builder prune
docker container prune
```

Do not use `docker system prune --volumes` on a production host unless all named volumes are backed up and disposable.

### Docker health checks

The backend health check calls `/api/health`. The frontend health check requests `/`. Compose waits for the backend health check before starting the frontend. Inspect health status with:

```bash
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q backend)"
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q frontend)"
```

## Database, Migration, and Seed Behavior

### Runtime database

The application uses `better-sqlite3` directly. The runtime database is the file configured by `DATABASE_PATH`, defaulting to `backend/dev.db` for a local checkout. The Docker path is `/app/data/inventory.db` on the `inventory_data` named volume.

### Initialization

```bash
cd backend
npm run db:init
```

`init-db.js`:

- Creates `user`, `laptop`, `employee`, `vendor`, and `audit_log` tables if missing.
- Applies additive SQLite updates for laptop storage type/capacity, access details, and location columns when upgrading an older database.
- Creates the bootstrap admin only if the user table is empty.
- Seeds 45 laptops, 39 employees, and 5 India vendors only when all three inventory tables are empty.
- Does not delete or overwrite existing inventory.

### Prisma clarification

`backend/prisma/schema.prisma` contains only generator and datasource configuration, and `backend/prisma/migrations` is absent. The Express application does not import the generated Prisma client. Do not document or run the following as a deployment migration:

```bash
npx prisma migrate deploy
npx prisma db push
```

For future schema changes, add and test an explicit SQLite migration in `init-db.js` or introduce a real migration system before deploying that schema change.

## Backup and Restore

Back up both the SQLite file and the filesystem backup directory.

### Traditional Linux/Windows file backup

Stop the backend service first so SQLite is not being written:

Linux:

```bash
sudo systemctl stop isg-inventory-api
sudo cp /var/lib/isg-inventory/inventory.db /var/backups/isg-inventory/inventory-$(date +%F-%H%M%S).db
sudo tar -czf /var/backups/isg-inventory/files-$(date +%F-%H%M%S).tar.gz -C /var/backups/isg-inventory inventory.db
sudo systemctl start isg-inventory-api
```

Windows PowerShell:

```powershell
nssm stop ISGInventoryAPI
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item 'C:\ProgramData\ISG\Inventory\data\inventory.db' "C:\ProgramData\ISG\Inventory\backups\inventory-$stamp.db"
nssm start ISGInventoryAPI
```

For a live SQLite database, use the SQLite `.backup` command when the `sqlite3` CLI is installed:

```bash
sqlite3 /var/lib/isg-inventory/inventory.db ".backup '/var/backups/isg-inventory/inventory-live-$(date +%F-%H%M%S).db'"
```

### Docker volume backup

Find the actual volume names:

```bash
docker volume ls | grep inventory
```

Create a backup directory and archive the database volume:

```bash
mkdir -p docker-backups
docker run --rm \
  -v it-inventory_inventory_data:/data:ro \
  -v "$PWD/docker-backups:/backup" \
  alpine tar czf /backup/inventory-data-$(date +%F-%H%M%S).tar.gz -C /data .
```

Use the volume name shown by `docker volume ls`; the Compose project prefix may differ from `it-inventory`.

Backup application-generated files:

```bash
docker run --rm \
  -v it-inventory_inventory_backups:/data:ro \
  -v "$PWD/docker-backups:/backup" \
  alpine tar czf /backup/inventory-files-$(date +%F-%H%M%S).tar.gz -C /data .
```

Restore procedure:

1. Stop the stack with `docker compose stop`.
2. Keep a copy of the current volumes for rollback.
3. Extract the archive into the named volume using a temporary Alpine container.
4. Start the stack and run `docker compose logs backend`.
5. Verify `/api/health`, login, dashboard totals, and a database record.

Do not restore a database archive over a running SQLite writer.

## Updates and Rollback

### Traditional server update

1. Take a database and backup-file backup.
2. Put the application into a maintenance window if needed.
3. Pull the release:

```bash
cd /srv/isg-inventory
git fetch --tags
git checkout <release-or-branch>
```

4. Install locked dependencies:

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

5. Initialize any additive schema changes:

```bash
cd ../backend && npm run db:init
```

6. Build the frontend:

```bash
cd ../frontend && VITE_API_BASE_URL=/api npm run build
```

7. Restart the backend and reload Nginx/IIS.
8. Run the smoke tests.

Rollback by checking out the previous release, restoring the database if the release changed data, rebuilding the frontend, and restarting the service.

### Docker update

```bash
git fetch --tags
git checkout <release-or-branch>
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d --build
docker compose ps
docker compose logs --tail=200 backend
```

Named volumes are retained by `down`. Use the previous image/release or restore a volume backup for rollback.

## Production Security

- Replace `JWT_SECRET` with a random secret of at least 32 characters.
- Never commit `.env`, `.env.docker`, database files, or backup files.
- Change the seeded `admin@example.com` / `admin123` credential before go-live.
- Disable or protect public registration if the application should be invite-only.
- Use HTTPS everywhere outside localhost.
- Set `CORS_ORIGIN` to the exact public frontend origin, not `*`.
- Keep port 5000 private and expose only the reverse proxy.
- Restrict SSH/RDP to VPN or administrator IP ranges.
- Run the backend under a non-root service account; the Docker image runs as the `node` user.
- Grant write access only to the database and backup directories.
- Keep Node.js, npm, OS packages, Docker, and dependencies patched.
- Review `npm audit` results before releases and test fixes before production.
- Limit and rotate backup retention. Encrypt backups at rest and in transit.
- Monitor failed logins, 4xx/5xx rates, disk capacity, and SQLite backup success.
- Do not run development Vite servers in production.
- Do not horizontally scale multiple backend writers against one SQLite file.

## Monitoring and Logs

The backend writes request logs through Morgan and errors to process stderr.

Systemd:

```bash
sudo journalctl -u isg-inventory-api -f
sudo journalctl -u nginx -f
```

NSSM logs are configured in the Windows service example:

```text
C:\ProgramData\ISG\Inventory\api-stdout.log
C:\ProgramData\ISG\Inventory\api-stderr.log
```

Docker:

```bash
docker compose logs --tail=200 backend
docker compose logs --follow backend frontend
```

Set log rotation for Docker and Windows/Linux host logs. Alert on:

- Backend health check failure.
- HTTP 5xx responses.
- Repeated authentication failures.
- Database disk usage above 70%.
- Backup age exceeding the defined recovery point objective.
- Container restart loops or systemd service failures.

## Post-Deployment Testing

Run these checks from the deployed hostname, not only from localhost.

### Availability and authentication

```bash
curl --fail https://inventory.example.com/api/health
```

In the browser:

1. Open `https://inventory.example.com`.
2. Sign in with the approved administrator account.
3. Confirm the user name appears in the header.
4. Sign out and verify the login screen returns.
5. Sign in again and refresh the page to confirm the JWT session is accepted.

### Laptop and database workflow

1. Open **Laptops** from the navigation menu.
2. Add a laptop with a valid purchase date and a price such as `₹25,63,000`.
3. Confirm the value is displayed with Indian grouping.
4. Edit the laptop and change the price.
5. Return to **Dashboard** and click **Refresh**.
6. Confirm **Total Spend** changes by the exact difference.
7. Confirm **Purchase cost by year** changes under the purchase year.
8. Delete the test laptop.
9. Refresh the dashboard and confirm the spend and yearly chart revert.
10. Try letters or a negative price and confirm validation rejects them.

### Dashboard calculations

1. Compare the dashboard laptop count with `GET /api/laptops`.
2. Compare Employees and Vendors cards with `GET /api/employees` and `GET /api/vendors`.
3. Add a purchase in a new year and verify a new chart year appears.
4. Edit only the purchase date and verify the amount moves between year groups.
5. Delete the purchase and verify the amount disappears.
6. Wait for the 15-second refresh or use the **Refresh** button to verify external database changes.

### UI and export workflow

1. Search the database-backed asset register and open the compact **Refine** panel.
2. Switch between Table, Cards, Compact, and Detailed views.
3. Add and edit each separate CPU, RAM, storage, OS, Office, antivirus, price, and date field.
4. Import a valid CSV and a duplicate/invalid CSV using the help dialog and sample template.
5. Export filtered records to CSV and confirm separate specification columns and DD/MM/YYYY dates.
6. Export to PDF and confirm the browser print dialog contains the expected rows and Indian prices.
7. Toggle Dark Mode and Light Mode; refresh and confirm the setting persists.
8. Confirm `₹` and grouping such as `₹25,63,000`.
9. Confirm dates use DD/MM/YYYY wherever a full date is displayed.
10. Test at desktop, tablet, and mobile widths using browser responsive tools.

### API smoke test

```bash
curl --fail https://inventory.example.com/api/health
# Obtain a JWT from /api/auth/login and send it as Authorization: Bearer <token>.
curl --fail -H "Authorization: Bearer <token>" https://inventory.example.com/api/laptops
curl --fail -H "Authorization: Bearer <token>" https://inventory.example.com/api/employees
curl --fail -H "Authorization: Bearer <token>" https://inventory.example.com/api/vendors
curl --fail -H "Authorization: Bearer <token>" https://inventory.example.com/api/admin/dashboard
```

The dashboard response should contain totals, `brandData`, `ageData`, `spendData`, `statusData`, and `recentActivity`.

## Troubleshooting

### Blank page after deployment

- Confirm `frontend/dist/index.html` exists.
- Confirm the frontend was built with `VITE_API_BASE_URL=/api`.
- Confirm Nginx or IIS has React history fallback to `index.html`.
- Check browser developer tools for failed asset requests.
- Rebuild after changing Vite environment variables; they are not runtime variables.

### Dashboard shows an API/network error or stale data

- Check `curl http://127.0.0.1:5000/api/health` on the server.
- Check the browser request URL; it should be `/api/admin/dashboard` behind the proxy.
- Verify the reverse proxy forwards `/api/` without removing the `/api` prefix.
- Check backend logs for SQLite or permission errors.
- Use the dashboard Refresh button after correcting the service.

### 502 Bad Gateway

- Confirm the backend service is running.
- Confirm port 5000 is listening on loopback.
- Confirm Nginx `proxy_pass` is `http://127.0.0.1:5000` for a traditional deployment.
- Confirm Docker frontend Nginx uses `http://backend:5000` inside Compose.
- Run `nginx -t` and inspect the proxy error log.

### CORS errors

- Prefer the same-origin `/api` setup.
- If using separate frontend/API hosts, set `VITE_API_BASE_URL` to the API URL and rebuild.
- Set `CORS_ORIGIN` to the exact frontend origin including `https://` and port if applicable.
- Restart the backend after changing `.env`.

### `npm ci` fails on better-sqlite3 or bcrypt

- Verify Node 20+.
- Install Python 3, a C/C++ compiler, and Make/build tools.
- Delete `node_modules` and rerun `npm ci`.
- On Docker, use the included backend image; it installs `python3`, `make`, and `g++`.

### Database is locked or cannot be opened

- Ensure only one backend process uses the database.
- Ensure `DATABASE_PATH` points to a local disk, not a network share.
- Ensure the service account has read/write permission to the parent directory.
- Stop the service before copying or restoring a SQLite file.
- Confirm the parent directory exists; `init-db.js` creates it for configured paths.

### Login fails after deployment

- Confirm the database was initialized.
- Confirm `JWT_SECRET` is stable between restarts.
- Confirm the user exists in the `user` table.
- Confirm the browser is calling the intended API host.
- Clear an expired browser token and sign in again.

### Docker frontend cannot reach the API

- Confirm both services are on the `inventory` network.
- Confirm `docker compose ps` reports the backend healthy.
- Confirm `frontend/nginx.conf` uses `proxy_pass http://backend:5000`.
- Do not set `VITE_API_BASE_URL=http://localhost:5000/api` for a browser using the frontend container; `localhost` would mean the user's computer.

### Docker data disappeared

- Do not use `docker compose down --volumes`.
- Confirm the named `inventory_data` volume exists.
- Confirm `DATABASE_PATH=/app/data/inventory.db`.
- Restore the most recent volume archive if the volume was deleted.

### HTTPS certificate or redirect problems

- Confirm DNS resolves to the reverse proxy server.
- Confirm ports 80 and 443 are reachable.
- Confirm the certificate hostname matches the browser hostname.
- Avoid redirect loops by forwarding `X-Forwarded-Proto` and configuring only one HTTPS terminator.

## Deployment Checklist

### Server preparation

- [ ] Operating system patched.
- [ ] Node.js 24.x and npm 11.x installed.
- [ ] Git installed or release archive transferred.
- [ ] Native build tools installed.
- [ ] Service account created.
- [ ] Application, database, and backup directories created.
- [ ] Time synchronization enabled.

### Project setup

- [ ] Correct release checked out.
- [ ] `backend/package-lock.json` and `frontend/package-lock.json` present.
- [ ] `npm ci` completed in both projects.
- [ ] `.env` created outside source control.
- [ ] `JWT_SECRET` replaced.
- [ ] `DATABASE_PATH` points to persistent storage.
- [ ] `CORS_ORIGIN` matches the public frontend origin.

### Database

- [ ] `npm run db:init` completed.
- [ ] Bootstrap credentials changed or protected.
- [ ] Database permissions tested as the service account.
- [ ] Seed data verified or production data restored.
- [ ] Backup and restore procedure tested.

### Build and deployment

- [ ] `npm run lint` reviewed.
- [ ] `npm run build` completed.
- [ ] `frontend/dist` deployed to IIS/Nginx or image.
- [ ] Backend process managed by systemd, NSSM, or Docker.
- [ ] `/api/health` returns HTTP 200.
- [ ] Reverse proxy routes `/api/*` correctly.

### HTTPS and firewall

- [ ] DNS A/AAAA record points to the server.
- [ ] Port 80 is available for certificate issuance/redirect.
- [ ] Port 443 is open.
- [ ] Port 5000 is private.
- [ ] SSH/RDP is restricted.
- [ ] TLS certificate installed and renewal tested.

### Go-live and operations

- [ ] Login/logout tested.
- [ ] Laptop Add/Edit/Delete tested.
- [ ] Purchase price, dashboard total, and yearly chart tested.
- [ ] Employee and vendor API counts tested.
- [ ] Import, CSV, and PDF workflows tested.
- [ ] Light/Dark mode tested.
- [ ] Indian number/date/currency formatting tested.
- [ ] Mobile/tablet layout tested.
- [ ] Monitoring and log retention configured.
- [ ] Backup schedule and restore owner assigned.
- [ ] Rollback release identified.

## Quick Deployment Guide

### Linux or Ubuntu, traditional deployment

```bash
sudo apt update && sudo apt install -y ca-certificates curl git build-essential python3 nginx ufw
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo git clone <repository-url> /srv/isg-inventory
cd /srv/isg-inventory
sudo cp .env.example backend/.env
sudo editor backend/.env
cd backend && sudo npm ci && sudo npm run db:init
cd ../frontend && sudo npm ci && sudo env VITE_API_BASE_URL=/api npm run build
sudo systemctl enable --now isg-inventory-api
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d inventory.example.com
```

Before the commands above, create the `isginventory` service account, install the systemd unit from this document, and configure the Nginx site. Complete the smoke-test checklist before go-live.

### Docker

```bash
git clone <repository-url> it-inventory
cd it-inventory
cp .env.example .env.docker
editor .env.docker
docker compose --env-file .env.docker config
docker compose --env-file .env.docker up -d --build
docker compose ps
docker compose logs --tail=100 backend
```

Open `http://localhost:8080` for a direct test. For production, bind the frontend host port to loopback, put HTTPS Nginx/IIS in front of it, configure DNS and TLS, and back up the `inventory_data` and `inventory_backups` volumes before go-live.
