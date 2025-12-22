# Architecture

This document describes the system architecture of ClovaLink, including data flows, design decisions, and component interactions.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│    Frontend (React)     │   │    Backend (Rust/Axum)  │
│    - Nginx proxy        │   │    - REST API           │
│    - Static assets      │   │    - Auth middleware    │
│    - SPA routing        │   │    - File handlers      │
└─────────────────────────┘   └─────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │   PostgreSQL    │   │     Redis       │   │   S3/Local      │
          │   - User data   │   │   - Cache       │   │   - File data   │
          │   - Metadata    │   │   - Sessions    │   │   - Uploads     │
          │   - Audit logs  │   │   - Rate limits │   │   - Avatars     │
          └─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Component Architecture

### Backend Crates

ClovaLink's backend is organized as a Rust workspace with multiple crates:

```
backend/
├── crates/
│   ├── api/          # HTTP handlers and middleware
│   ├── auth/         # Authentication and JWT
│   ├── core/         # Shared types and utilities
│   ├── storage/      # File storage abstraction
│   └── extensions/   # Extension system
└── migrations/       # Database migrations
```

| Crate | Responsibility |
|-------|----------------|
| `clovalink_api` | REST API handlers, middleware, routing |
| `clovalink_auth` | JWT generation/validation, session management |
| `clovalink_core` | Cache, circuit breaker, queue utilities |
| `clovalink_storage` | S3 and local filesystem abstraction |
| `clovalink_extensions` | Extension registration, webhooks, automation |

### Data Flow

#### Authentication Flow

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│ Client │────▶│  Login  │────▶│ Validate │────▶│  JWT   │
│        │     │ Request │     │ Password │     │ Token  │
└────────┘     └─────────┘     └──────────┘     └────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │   Generate   │
                            │ Fingerprint  │
                            └──────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │    Create    │
                            │   Session    │
                            └──────────────┘
```

1. **Login Request**: User submits email/password
2. **Validate Password**: Argon2id hash verification
3. **Generate Fingerprint**: Hash of User-Agent + Accept-Language + partial IP
4. **Create Session**: Store session in database with token hash
5. **JWT Token**: Return signed JWT with user claims and fingerprint

#### File Upload Flow

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Client │────▶│  Upload  │────▶│ Validate │────▶│ Content │
│        │     │ Request  │     │  Access  │     │  Hash   │
└────────┘     └──────────┘     └──────────┘     └─────────┘
                                                      │
                      ┌───────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐     ┌──────────────┐
              │    Check     │────▶│    Store     │
              │  Dedup Hash  │     │    File      │
              └──────────────┘     └──────────────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │   Create     │
                                  │  Metadata    │
                                  └──────────────┘
```

1. **Upload Request**: Multipart form with file data
2. **Validate Access**: Check department/tenant permissions
3. **Content Hash**: Calculate Blake3 hash for deduplication
4. **Check Dedup**: If hash exists in same department, reuse storage
5. **Store File**: Save to S3 or local filesystem
6. **Create Metadata**: Insert file record in database

#### Request Middleware Chain

```
Request → Rate Limit → Auth → IP Check → Fingerprint → Handler → Response
              │          │        │            │
              ▼          ▼        ▼            ▼
         429 Error   401 Error  403 Error  Log Warning
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   tenants    │◄────│    users     │────▶│ departments  │
│              │     │              │     │              │
│ - id (PK)    │     │ - id (PK)    │     │ - id (PK)    │
│ - name       │     │ - tenant_id  │     │ - tenant_id  │
│ - domain     │     │ - email      │     │ - name       │
│ - plan       │     │ - role       │     └──────────────┘
│ - status     │     │ - status     │
└──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│files_metadata│◄────│ file_shares  │     │ file_requests│
│              │     │              │     │              │
│ - id (PK)    │     │ - id (PK)    │     │ - id (PK)    │
│ - tenant_id  │     │ - file_id    │     │ - tenant_id  │
│ - name       │     │ - token      │     │ - token      │
│ - storage_   │     │ - is_public  │     │ - status     │
│   path       │     │ - expires_at │     │ - expires_at │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Organizations using the platform |
| `users` | User accounts with tenant association |
| `departments` | Organizational units within tenants |
| `files_metadata` | File and folder metadata |
| `file_shares` | Share tokens for file links |
| `file_requests` | Upload request portals |
| `audit_logs` | Activity tracking for compliance |
| `security_alerts` | Security incident tracking |
| `user_sessions` | Active login sessions |

## Caching Strategy

### Redis Cache Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Cache Hierarchy                       │
├─────────────────────────────────────────────────────────┤
│  L1: Global Settings          TTL: 10 min               │
│      - App name, theme, footer                          │
├─────────────────────────────────────────────────────────┤
│  L2: Tenant Settings          TTL: 5 min                │
│      - Compliance mode, quotas, policies                │
├─────────────────────────────────────────────────────────┤
│  L3: Dashboard Stats          TTL: 60 sec               │
│      - File counts, storage usage                       │
├─────────────────────────────────────────────────────────┤
│  L4: Session Data             TTL: Token expiry         │
│      - User context, permissions                        │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation

- **Global Settings**: Invalidated on any setting update
- **Tenant Settings**: Invalidated on tenant update
- **Dashboard Stats**: Short TTL, no active invalidation
- **Sessions**: Invalidated on logout/revoke

### Circuit Breaker

Redis operations use a circuit breaker pattern:

```
┌──────────────────────────────────────────────────────┐
│                Circuit Breaker States                 │
├──────────────────────────────────────────────────────┤
│  CLOSED: Normal operation                             │
│          - All requests go to Redis                   │
│          - Track failures                             │
│                                                       │
│  OPEN:   Redis unavailable                            │
│          - Skip Redis, use fallback                   │
│          - Wait for recovery period                   │
│                                                       │
│  HALF-OPEN: Testing recovery                          │
│          - Allow limited requests                     │
│          - If success → CLOSED                        │
│          - If failure → OPEN                          │
└──────────────────────────────────────────────────────┘
```

Configuration:
- Failure threshold: 5 consecutive failures
- Recovery timeout: 30 seconds
- Half-open max requests: 3

## Storage Architecture

### Storage Abstraction

```rust
#[async_trait]
pub trait Storage: Send + Sync {
    async fn upload(&self, key: &str, data: Vec<u8>) -> Result<String>;
    async fn download(&self, key: &str) -> Result<Vec<u8>>;
    async fn delete(&self, key: &str) -> Result<()>;
    async fn presigned_download_url(&self, key: &str, expires: u64) -> Result<Option<String>>;
}
```

### Implementations

| Backend | Use Case | Configuration |
|---------|----------|---------------|
| `LocalStorage` | Development, small deployments | `STORAGE_TYPE=local` |
| `S3Storage` | Production, scalable | `STORAGE_TYPE=s3` + credentials |

### Content Deduplication

Files are deduplicated per-department using Blake3 content hashing:

```
┌─────────────────────────────────────────────────────────┐
│  Upload Flow with Deduplication                          │
├─────────────────────────────────────────────────────────┤
│  1. Calculate Blake3 hash of file content               │
│  2. Query: SELECT storage_path FROM files_metadata      │
│            WHERE tenant_id = ? AND department_id = ?    │
│            AND content_hash = ?                         │
│  3. If exists: Reuse storage_path, skip upload          │
│  4. If new: Upload to storage, create metadata          │
└─────────────────────────────────────────────────────────┘
```

Benefits:
- Reduces storage costs
- Faster uploads for duplicate files
- Department isolation maintained

## Security Architecture

### Authentication

```
┌─────────────────────────────────────────────────────────┐
│              JWT Token Structure                         │
├─────────────────────────────────────────────────────────┤
│  Header:                                                 │
│    { "alg": "HS256", "typ": "JWT" }                     │
│                                                         │
│  Payload:                                               │
│    {                                                    │
│      "sub": "user-uuid",                                │
│      "tenant_id": "tenant-uuid",                        │
│      "role": "Admin",                                   │
│      "fingerprint": "sha256-hash",                      │
│      "exp": 1703260800,                                 │
│      "iss": "clovalink",                                │
│      "aud": "clovalink-api"                             │
│    }                                                    │
│                                                         │
│  Signature: HMAC-SHA256(header + payload, secret)       │
└─────────────────────────────────────────────────────────┘
```

### Session Fingerprinting

Prevents token theft by validating request context:

```
Fingerprint = SHA256(
    User-Agent +
    Accept-Language +
    IP-Prefix (first 3 octets)
)
```

- Embedded in JWT claims at login
- Validated on every authenticated request
- Mismatch logs warning (allows for NAT/mobile)

### Password Hashing

Using Argon2id with tuned parameters:

```rust
Argon2::new(
    Algorithm::Argon2id,
    Version::V0x13,
    Params::new(65536, 3, 4, None)  // 64MB, 3 iterations, 4 lanes
)
```

Why Argon2id:
- Memory-hard (resists GPU attacks)
- Combines Argon2i (side-channel resistant) and Argon2d (GPU resistant)
- OWASP recommended

## Multi-Tenancy

### Data Isolation

```
┌─────────────────────────────────────────────────────────┐
│  Tenant Isolation Strategy                               │
├─────────────────────────────────────────────────────────┤
│  Database: Row-level filtering by tenant_id              │
│            All queries include tenant_id in WHERE        │
│                                                         │
│  Storage:  Prefixed paths: {tenant_id}/path/file.ext    │
│            Each tenant's files in separate "directory"   │
│                                                         │
│  Cache:    Namespaced keys: tenant:{id}:settings        │
│            Prevents cross-tenant cache pollution         │
└─────────────────────────────────────────────────────────┘
```

### Role Hierarchy

```
SuperAdmin ─┬─ Admin ─┬─ Manager ─┬─ Employee
            │         │           │
            │         │           └─ files.view
            │         │              files.upload
            │         │              files.download
            │         │
            │         └─ + files.delete
            │            + files.share
            │            + requests.create
            │            + requests.view
            │
            └─ + users.view/invite/edit
               + roles.view
               + audit.view
               + settings.view

SuperAdmin adds:
  + users.delete
  + roles.manage
  + audit.export
  + settings.edit
  + tenants.manage
```

## Extension System

### Extension Types

| Type | Description | Hook Points |
|------|-------------|-------------|
| `UIExtension` | Custom UI components | Dashboard, file browser, settings |
| `FileProcessor` | Automated file handling | On upload, on download |
| `Automation` | Scheduled background jobs | Cron expressions |

### Webhook Flow

```
┌─────────┐     ┌────────────┐     ┌──────────────┐
│  Event  │────▶│  Extension │────▶│   External   │
│ Trigger │     │  Webhook   │     │   Service    │
└─────────┘     └────────────┘     └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │    Sign      │
              │   Payload    │
              │  (HMAC-256)  │
              └──────────────┘
```

## Performance Considerations

### Database Connection Pool

```rust
PgPoolOptions::new()
    .max_connections(50)      // Max concurrent connections
    .min_connections(10)      // Always keep warm
    .acquire_timeout(5s)      // Max wait for connection
    .idle_timeout(600s)       // Close idle after 10 min
    .max_lifetime(1800s)      // Refresh connections every 30 min
```

### Backpressure Handling

```
┌─────────────────────────────────────────────────────────┐
│  Request Processing Pipeline                             │
├─────────────────────────────────────────────────────────┤
│  1. Rate Limiting (per-IP)                               │
│     - 100 req/sec default                               │
│     - Burst: 200                                        │
│                                                         │
│  2. Concurrency Limit                                   │
│     - Max 1000 concurrent requests                      │
│                                                         │
│  3. Request Timeout                                     │
│     - 300s for file uploads                             │
│     - 30s for regular requests                          │
│                                                         │
│  4. Circuit Breaker (Redis)                             │
│     - Fail-fast when Redis unavailable                  │
└─────────────────────────────────────────────────────────┘
```

### Transfer Scheduler

Large file transfers are prioritized and bandwidth-limited:

```
┌─────────────────────────────────────────────────────────┐
│  Transfer Queue Priorities                               │
├─────────────────────────────────────────────────────────┤
│  Small (<1MB):    50 concurrent, no limit               │
│  Medium (1-50MB): 20 concurrent, no limit               │
│  Large (>50MB):   5 concurrent, 50MB/s bandwidth cap    │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Production Setup

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (Nginx/ALB)   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │  Backend   │    │  Backend   │    │  Backend   │
    │  Instance  │    │  Instance  │    │  Instance  │
    └──────┬─────┘    └──────┬─────┘    └──────┬─────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Postgres │   │  Redis   │   │    S3    │
       │ Primary  │   │ Cluster  │   │  Bucket  │
       └──────────┘   └──────────┘   └──────────┘
```

### Health Checks

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `/health` | Liveness probe | Every 10s |
| `/health/ready` | Readiness probe | Every 5s |
| `/api/admin/health` | Detailed metrics | On demand |

