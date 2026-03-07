# Forward Widget Hub

A self-hosted platform for uploading and hosting [ForwardWidget](https://github.com/user/ForwardWidgets) modules. Upload your `.js` widget files and get a shareable `.fwd` subscription link for [Forward App](https://apps.apple.com/app/forward/id1490153115).

## Features

- Drag-and-drop upload for `.js` widget modules
- Automatic `WidgetMetadata` parsing and validation
- Token-based management (no registration required)
- `.fwd` subscription link generation for Forward App
- Support for encrypted modules (FWENC1 format)
- SQLite database + local file storage
- Single Docker container deployment
- Dark/light theme support

## Quick Start

### Docker (Recommended)

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/data \
  -e SITE_URL=https://your-domain.com \
  forward-widget-hub
```

### Docker Compose

```bash
git clone https://github.com/user/forward-widget-hub.git
cd forward-widget-hub
docker compose up -d
```

### Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_URL` | `http://localhost:3000` | Public URL for generating links |
| `DATA_DIR` | `./data` | Directory for SQLite database and module files |
| `PORT` | `3000` | Server port |

## How It Works

1. **Upload**: Drag `.js` widget files to the upload zone
2. **Get Token**: First upload generates a management token - save it!
3. **Share**: Copy the `.fwd` subscription link
4. **Import**: Add the link in Forward App to import your widgets

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload widget files |
| `GET` | `/api/collections/:slug` | Get collection info |
| `GET` | `/api/collections/:slug/fwd` | Get `.fwd` index for Forward App |
| `GET` | `/api/modules/:id/raw` | Download raw module file |
| `GET` | `/api/manage?token=xxx` | List your collections |
| `DELETE` | `/api/modules/:id?token=xxx` | Delete a module |

## Data Storage

All data is stored in the `/data` volume:

```
/data/
├── db.sqlite          # SQLite database
└── modules/
    └── <collection>/
        └── widget.js  # Module files
```

Backup: just copy the `/data` directory.

## Security

- Tokens are SHA-256 hashed before storage
- Rate limiting: 10 auth requests/min per IP, 15-min lockout after 5 failures
- Module files are served as-is (no server-side execution)
- WidgetMetadata is parsed with regex, never eval'd

## License

MIT
