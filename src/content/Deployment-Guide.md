# Deployment Guide

This guide covers deploying ClovaLink in various environments, from local development to production.

## Prerequisites

- **Docker** 20.10+ with Docker Compose, OR
- **Podman** 4.0+ with podman-compose
- **4GB RAM** minimum (8GB+ recommended for production)
- **PostgreSQL 16+** (included in Docker setup)
- **Redis 7+** (included in Docker setup)

## Quick Start (Development)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/clovalink.git
cd clovalink/infra

# Copy environment template
cp .env.example .env
```

### 2. Start Services

```bash
# Using Docker Compose
docker compose up -d

# Using Podman
podman compose up -d
```

### 3. Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

### 4. Default Credentials

```
Email: superadmin@clovalink.com
Password: password123
```

> ⚠️ **Change this immediately in production!**

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs (32+ chars) | `your-super-secret-key-here` |

### Storage Configuration

#### Local Storage (Default)

```bash
STORAGE_TYPE=local
```

Files stored in `/app/uploads` inside the container.

#### S3-Compatible Storage

```bash
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
AWS_ENDPOINT_URL=https://s3.region.backblazeb2.com
AWS_REGION=us-west-004
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
```

Supported providers:
- AWS S3
- Backblaze B2
- MinIO
- Wasabi
- DigitalOcean Spaces
- Any S3-compatible storage

### Database Connection Pool

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_MAX_CONNECTIONS` | 50 | Maximum connections in pool |
| `DB_MIN_CONNECTIONS` | 10 | Minimum idle connections |
| `DB_ACQUIRE_TIMEOUT_SECS` | 5 | Timeout waiting for connection |
| `DB_IDLE_TIMEOUT_SECS` | 600 | Close idle connections after |
| `DB_MAX_LIFETIME_SECS` | 1800 | Refresh connections every |

### Rate Limiting & Backpressure

| Variable | Default | Description |
|----------|---------|-------------|
| `REQUEST_TIMEOUT_SECS` | 300 | Max request duration (for uploads) |
| `MAX_CONCURRENT_REQUESTS` | 1000 | Concurrent request limit |
| `PER_IP_REQUESTS_PER_SEC` | 100 | Rate limit per IP |
| `PER_IP_BURST_SIZE` | 200 | Burst allowance |
| `CIRCUIT_BREAKER_THRESHOLD` | 5 | Redis failures before open |
| `CIRCUIT_BREAKER_RECOVERY_SECS` | 30 | Recovery timeout |

### Transfer Scheduler

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSFER_SMALL_CONCURRENT` | 50 | Concurrent small file (<1MB) transfers |
| `TRANSFER_MEDIUM_CONCURRENT` | 20 | Concurrent medium file (1-50MB) transfers |
| `TRANSFER_LARGE_CONCURRENT` | 5 | Concurrent large file (>50MB) transfers |
| `TRANSFER_LARGE_BANDWIDTH_MBPS` | 50 | Bandwidth cap for large files |

### Optional Features

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_PRESIGNED_URLS` | false | Use S3 presigned URLs for downloads |
| `PRESIGNED_URL_EXPIRY_SECS` | 3600 | Presigned URL expiration |
| `CDN_DOMAIN` | none | CDN domain for presigned URLs |
| `CORS_DEV_MODE` | false | Allow localhost CORS origins |
| `ENVIRONMENT` | production | development/production |
| `RUST_LOG` | info | Log level (trace/debug/info/warn/error) |

---

## Docker Compose Configuration

### Production `compose.yml`

```yaml
services:
  backend:
    build:
      context: ../backend
      dockerfile: ../infra/Dockerfile.backend
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgres://postgres:${DB_PASSWORD}@postgres:5432/clovalink
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - RUST_LOG=info
      - ENVIRONMENT=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ../frontend
      dockerfile: ../infra/Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl:ro  # For HTTPS

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=clovalink
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

---

## S3 Storage Setup

### Backblaze B2

1. **Create a Bucket**
   - Go to Backblaze B2 Console → Buckets → Create a Bucket
   - Name: `your-clovalink-bucket`
   - Type: Private (recommended)
   - Encryption: Enabled

2. **Create Application Key**
   - Go to Application Keys → Add a New Application Key
   - Name: `clovalink`
   - Select your bucket
   - Copy the keyID and applicationKey

3. **Configure Environment**
   ```bash
   STORAGE_TYPE=s3
   S3_BUCKET=your-clovalink-bucket
   AWS_ENDPOINT_URL=https://s3.us-west-004.backblazeb2.com
   AWS_REGION=us-west-004
   AWS_ACCESS_KEY_ID=your-key-id
   AWS_SECRET_ACCESS_KEY=your-application-key
   ```

4. **CORS Configuration** (if using presigned URLs)
   ```json
   [
     {
       "corsRuleName": "clovalink",
       "allowedOrigins": ["https://your-domain.com"],
       "allowedOperations": ["s3_get", "s3_put"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

### AWS S3

1. **Create S3 Bucket**
   - Create bucket with default settings
   - Enable versioning (optional, for compliance)
   - Block public access

2. **Create IAM User**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket",
           "arn:aws:s3:::your-bucket/*"
         ]
       }
     ]
   }
   ```

3. **Configure Environment**
   ```bash
   STORAGE_TYPE=s3
   S3_BUCKET=your-bucket
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```

### MinIO (Self-Hosted)

```yaml
# Add to docker-compose.yml
minio:
  image: minio/minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
```

```bash
STORAGE_TYPE=s3
S3_BUCKET=clovalink
AWS_ENDPOINT_URL=http://minio:9000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

---

## HTTPS Setup

### Using Nginx with Let's Encrypt

1. **Install Certbot**
   ```bash
   apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   certbot --nginx -d your-domain.com
   ```

3. **Update Nginx Config**
   The frontend Dockerfile includes Nginx. Update `frontend/nginx.conf`:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       # ... rest of config
   }
   ```

4. **Mount Certificates**
   ```yaml
   frontend:
     volumes:
       - /etc/letsencrypt/live/your-domain.com:/etc/nginx/ssl:ro
   ```

---

## Database Management

### Running Migrations

Migrations run automatically on backend startup. To run manually:

```bash
# Connect to backend container
docker compose exec backend sh

# Migrations are in /app/migrations
# SQLx runs them on startup
```

### Backup Database

```bash
# Dump database
docker compose exec postgres pg_dump -U postgres clovalink > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres clovalink < backup.sql
```

### Reset Database (Development)

```bash
docker compose down -v  # Removes volumes
docker compose up -d
```

---

## Production Checklist

### Security

- [ ] Change default `JWT_SECRET` (32+ random characters)
- [ ] Change default database password
- [ ] Enable HTTPS
- [ ] Configure firewall (only expose 80/443)
- [ ] Set `ENVIRONMENT=production`
- [ ] Disable `CORS_DEV_MODE`
- [ ] Configure strong password policy per tenant
- [ ] Enable MFA for admin accounts

### Performance

- [ ] Tune database connection pool for expected load
- [ ] Configure Redis persistence
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation

### Reliability

- [ ] Set up database backups
- [ ] Configure health checks in load balancer
- [ ] Set up alerting for health check failures
- [ ] Plan disaster recovery procedure

### Compliance

- [ ] Enable appropriate compliance mode per tenant
- [ ] Configure audit log retention
- [ ] Set up log export/archival
- [ ] Document data handling procedures

---

## Scaling

### Horizontal Scaling

ClovaLink backend is stateless and can be scaled horizontally:

```yaml
backend:
  deploy:
    replicas: 3
```

Requirements:
- Shared PostgreSQL
- Shared Redis
- Shared S3 storage (not local)

### Database Scaling

- **Read Replicas**: Add PostgreSQL read replicas for read-heavy loads
- **Connection Pooling**: Use PgBouncer for high connection counts
- **Partitioning**: Consider partitioning `audit_logs` and `api_usage` tables

### Redis Scaling

- **Redis Cluster**: For high availability
- **Redis Sentinel**: For automatic failover

---

## Monitoring

### Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Liveness | Empty 200 |
| `GET /health/ready` | Readiness | JSON with DB/Redis status |
| `GET /api/admin/health` | Detailed | Full system metrics |

### Prometheus Metrics

Export metrics for Prometheus by adding:

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"
```

### Log Aggregation

Backend logs are JSON-formatted when `RUST_LOG` is configured:

```bash
# View logs
docker compose logs -f backend

# Export logs
docker compose logs backend > backend.log
```

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: Failed to connect to database
```
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running and healthy
- Verify network connectivity between containers

**Redis Connection Failed**
```
WARN: Failed to initialize Redis cache (caching disabled)
```
- Check `REDIS_URL` format
- Ensure Redis is running
- The app will continue without caching

**Storage Upload Failed**
```
Error: Failed to upload file
```
- Verify S3 credentials are correct
- Check bucket exists and is accessible
- Verify IAM permissions include `s3:PutObject`

**JWT Secret Warning**
```
WARN: JWT_SECRET is less than 32 characters
```
- Use a longer secret (32+ characters)
- Generate with: `openssl rand -base64 32`

### Debug Mode

Enable verbose logging:
```bash
RUST_LOG=debug docker compose up backend
```

### Container Shell Access

```bash
# Backend
docker compose exec backend sh

# PostgreSQL
docker compose exec postgres psql -U postgres clovalink

# Redis
docker compose exec redis redis-cli
```

