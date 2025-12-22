# Extensions SDK

ClovaLink supports a powerful extension system that allows you to add custom functionality without modifying the core codebase.

## Extension Types

| Type | Description | Use Case |
|------|-------------|----------|
| **UIExtension** | Custom React components | Dashboard widgets, custom views |
| **FileProcessor** | File handling automation | Thumbnails, virus scanning, OCR |
| **Automation** | Scheduled background jobs | Reports, cleanup, sync |

## Extension Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Register   │────▶│   Install    │────▶│    Active    │
│  (manifest)  │     │  (per-tenant)│     │  (running)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. **Register**: Extension is registered with ClovaLink (provides manifest)
2. **Install**: Tenant admin installs extension for their organization
3. **Active**: Extension receives events and can modify behavior

---

## Creating an Extension

### 1. Define the Manifest

Every extension requires a `manifest.json`:

```json
{
  "name": "My Extension",
  "slug": "my-extension",
  "version": "1.0.0",
  "description": "Description of what this extension does",
  "author": "Your Name",
  "homepage": "https://example.com",
  "type": "FileProcessor",
  "permissions": [
    "files.read",
    "files.write",
    "webhooks.receive"
  ],
  "settings_schema": {
    "type": "object",
    "properties": {
      "api_key": {
        "type": "string",
        "title": "API Key",
        "description": "Your service API key"
      },
      "enabled_types": {
        "type": "array",
        "items": { "type": "string" },
        "title": "File Types",
        "default": ["pdf", "docx"]
      }
    },
    "required": ["api_key"]
  },
  "events": [
    "file.uploaded",
    "file.downloaded"
  ],
  "webhook_url": "https://your-service.com/webhook",
  "ui_components": [
    {
      "type": "dashboard_widget",
      "name": "Stats Widget",
      "url": "https://your-service.com/widget.js"
    }
  ]
}
```

### 2. Register the Extension

```bash
curl -X POST http://localhost:3000/api/extensions/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "manifest_url": "https://your-service.com/manifest.json",
    "webhook_url": "https://your-service.com/webhook",
    "public_key": "optional-for-signature-verification"
  }'
```

### 3. Validate Manifest (Optional)

```bash
curl -X POST http://localhost:3000/api/extensions/validate-manifest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "manifest_url": "https://your-service.com/manifest.json"
  }'
```

---

## Manifest Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Human-readable name |
| `slug` | string | Unique identifier (lowercase, hyphens) |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `type` | string | "UIExtension", "FileProcessor", or "Automation" |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | What the extension does |
| `author` | string | Author name or organization |
| `homepage` | string | Extension website |
| `permissions` | array | Required permissions |
| `settings_schema` | object | JSON Schema for settings UI |
| `events` | array | Events to subscribe to |
| `webhook_url` | string | URL to receive webhooks |
| `ui_components` | array | UI components to render |

### Permissions

| Permission | Description |
|------------|-------------|
| `files.read` | Read file metadata and content |
| `files.write` | Create/modify files |
| `files.delete` | Delete files |
| `users.read` | Read user information |
| `webhooks.receive` | Receive webhook events |
| `settings.read` | Read tenant settings |

---

## Webhook Events

### Event Format

All webhook payloads follow this structure:

```json
{
  "event": "file.uploaded",
  "timestamp": "2024-12-20T15:30:00Z",
  "tenant_id": "uuid",
  "data": {
    // Event-specific data
  },
  "signature": "hmac-sha256-signature"
}
```

### Available Events

#### File Events

**file.uploaded**
```json
{
  "event": "file.uploaded",
  "data": {
    "file_id": "uuid",
    "name": "document.pdf",
    "size_bytes": 1048576,
    "content_type": "application/pdf",
    "path": "/Finance/2024",
    "department_id": "uuid",
    "uploaded_by": "uuid"
  }
}
```

**file.downloaded**
```json
{
  "event": "file.downloaded",
  "data": {
    "file_id": "uuid",
    "name": "document.pdf",
    "downloaded_by": "uuid",
    "ip_address": "192.168.1.1"
  }
}
```

**file.deleted**
```json
{
  "event": "file.deleted",
  "data": {
    "file_id": "uuid",
    "name": "document.pdf",
    "deleted_by": "uuid",
    "permanent": false
  }
}
```

**file.shared**
```json
{
  "event": "file.shared",
  "data": {
    "file_id": "uuid",
    "share_token": "abc123",
    "is_public": false,
    "expires_at": "2024-12-31T23:59:59Z",
    "created_by": "uuid"
  }
}
```

#### User Events

**user.created**
```json
{
  "event": "user.created",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "New User",
    "role": "Employee"
  }
}
```

**user.login**
```json
{
  "event": "user.login",
  "data": {
    "user_id": "uuid",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

#### Request Events

**request.created**
```json
{
  "event": "request.created",
  "data": {
    "request_id": "uuid",
    "name": "Q4 Documents",
    "token": "request-token",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

**request.upload**
```json
{
  "event": "request.upload",
  "data": {
    "request_id": "uuid",
    "file_id": "uuid",
    "filename": "document.pdf",
    "uploader_email": "external@example.com"
  }
}
```

---

## Verifying Webhook Signatures

Webhooks are signed using HMAC-SHA256 with your extension's public key.

### Node.js Example

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-clovalink-signature'];
  
  if (!verifySignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  const { event, data } = req.body;
  // ...
});
```

### Python Example

```python
import hmac
import hashlib
import json

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# In your Flask handler
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-ClovaLink-Signature')
    
    if not verify_signature(request.json, signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
    
    event = request.json['event']
    data = request.json['data']
    # Process the webhook
```

---

## UI Extensions

### Dashboard Widgets

Add custom widgets to the user dashboard:

```json
{
  "ui_components": [
    {
      "type": "dashboard_widget",
      "name": "Analytics Widget",
      "url": "https://your-service.com/widgets/analytics.js",
      "width": "half",
      "height": "medium"
    }
  ]
}
```

### Widget JavaScript

Your widget script should export a React component:

```javascript
// analytics.js
(function() {
  const AnalyticsWidget = ({ tenant_id, user_id, token }) => {
    const [data, setData] = React.useState(null);
    
    React.useEffect(() => {
      fetch(`https://your-service.com/api/stats?tenant=${tenant_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setData);
    }, [tenant_id]);
    
    if (!data) return <div>Loading...</div>;
    
    return (
      <div className="analytics-widget">
        <h3>Analytics</h3>
        <p>Total Files: {data.total_files}</p>
        <p>Storage Used: {data.storage_used}</p>
      </div>
    );
  };
  
  // Register the widget
  window.ClovaLinkExtensions.register('analytics-widget', AnalyticsWidget);
})();
```

### Widget Sizes

| Size | Width | Height |
|------|-------|--------|
| `full` | 100% | - |
| `half` | 50% | - |
| `third` | 33% | - |
| `small` | - | 150px |
| `medium` | - | 300px |
| `large` | - | 450px |

---

## Automation Extensions

### Cron-Based Jobs

Schedule recurring tasks:

```json
{
  "type": "Automation",
  "automation": {
    "jobs": [
      {
        "name": "Daily Report",
        "cron": "0 9 * * *",
        "webhook_path": "/jobs/daily-report"
      },
      {
        "name": "Weekly Cleanup",
        "cron": "0 0 * * 0",
        "webhook_path": "/jobs/weekly-cleanup"
      }
    ]
  }
}
```

### Job Webhook Payload

```json
{
  "event": "automation.trigger",
  "job_id": "uuid",
  "job_name": "Daily Report",
  "tenant_id": "uuid",
  "scheduled_time": "2024-12-20T09:00:00Z"
}
```

### Manual Trigger

Jobs can be manually triggered via API:

```bash
curl -X POST http://localhost:3000/api/extensions/trigger/automation/{job_id} \
  -H "Authorization: Bearer $TOKEN"
```

---

## File Processor Extensions

### Processing Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  Upload  │────▶│   Webhook    │────▶│  Process   │
│          │     │ file.uploaded│     │   File     │
└──────────┘     └──────────────┘     └────────────┘
                                            │
                                            ▼
                                    ┌────────────┐
                                    │  Update    │
                                    │  Metadata  │
                                    └────────────┘
```

### Example: Thumbnail Generator

```json
{
  "type": "FileProcessor",
  "events": ["file.uploaded"],
  "settings_schema": {
    "properties": {
      "thumbnail_size": {
        "type": "integer",
        "default": 200
      },
      "formats": {
        "type": "array",
        "default": ["jpg", "png", "gif"]
      }
    }
  }
}
```

```python
# Webhook handler
@app.route('/webhook', methods=['POST'])
def process_file():
    data = request.json['data']
    
    # Only process images
    if not data['content_type'].startswith('image/'):
        return {'status': 'skipped'}
    
    # Download the file
    file_content = download_file(data['file_id'])
    
    # Generate thumbnail
    thumbnail = create_thumbnail(file_content, size=200)
    
    # Upload thumbnail back
    upload_thumbnail(data['tenant_id'], data['file_id'], thumbnail)
    
    return {'status': 'processed'}
```

---

## Extension Settings

### Settings Schema

Use JSON Schema to define configurable settings:

```json
{
  "settings_schema": {
    "type": "object",
    "properties": {
      "api_key": {
        "type": "string",
        "title": "API Key",
        "description": "Your service API key",
        "format": "password"
      },
      "scan_on_upload": {
        "type": "boolean",
        "title": "Scan on Upload",
        "default": true
      },
      "excluded_types": {
        "type": "array",
        "title": "Excluded File Types",
        "items": { "type": "string" },
        "default": []
      },
      "notification_email": {
        "type": "string",
        "title": "Notification Email",
        "format": "email"
      }
    },
    "required": ["api_key"]
  }
}
```

### Accessing Settings

Settings are included in webhook payloads:

```json
{
  "event": "file.uploaded",
  "data": { ... },
  "settings": {
    "api_key": "sk-xxx",
    "scan_on_upload": true,
    "excluded_types": ["txt"]
  }
}
```

### Updating Settings

```bash
curl -X PUT http://localhost:3000/api/extensions/{id}/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "new-key",
    "scan_on_upload": false
  }'
```

---

## API Reference

### Register Extension

```http
POST /api/extensions/register
```

### Install Extension

```http
POST /api/extensions/install/{extension_id}
```

### List Available Extensions

```http
GET /api/extensions/list
```

### List Installed Extensions

```http
GET /api/extensions/installed
```

### Update Settings

```http
PUT /api/extensions/{id}/settings
```

### Trigger Automation

```http
POST /api/extensions/trigger/automation/{job_id}
```

### Get UI Extensions

```http
GET /api/extensions/ui
```

---

## Best Practices

### Security

1. **Validate signatures** on all webhooks
2. **Use HTTPS** for webhook URLs
3. **Scope permissions** to minimum required
4. **Store secrets** securely (not in code)

### Performance

1. **Respond quickly** to webhooks (< 5 seconds)
2. **Use async processing** for long-running tasks
3. **Implement retries** with exponential backoff
4. **Cache** frequently accessed data

### Reliability

1. **Handle failures gracefully**
2. **Log all webhook events**
3. **Implement idempotency** (handle duplicate events)
4. **Version your API** for backwards compatibility

---

## Example Extensions

### Virus Scanner

```json
{
  "name": "ClamAV Scanner",
  "slug": "clamav-scanner",
  "type": "FileProcessor",
  "events": ["file.uploaded"],
  "webhook_url": "https://scanner.example.com/webhook"
}
```

### Slack Notifications

```json
{
  "name": "Slack Notifier",
  "slug": "slack-notifier",
  "type": "Automation",
  "events": ["file.uploaded", "user.created"],
  "settings_schema": {
    "properties": {
      "webhook_url": {
        "type": "string",
        "title": "Slack Webhook URL"
      },
      "channel": {
        "type": "string",
        "title": "Channel",
        "default": "#general"
      }
    }
  }
}
```

### PDF Watermarker

```json
{
  "name": "PDF Watermark",
  "slug": "pdf-watermark",
  "type": "FileProcessor",
  "events": ["file.downloaded"],
  "settings_schema": {
    "properties": {
      "watermark_text": {
        "type": "string",
        "title": "Watermark Text",
        "default": "CONFIDENTIAL"
      },
      "opacity": {
        "type": "number",
        "title": "Opacity",
        "default": 0.3
      }
    }
  }
}
```

