# Incident Reference Database

Next.js frontend for searching public process-safety documents, browsing extracted gallery images, and opening a document at its physical PDF page.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to browser-safe credentials. Never use a service-role key in this application.

The anon role needs `SELECT` access to `documents`, `document_pages`, and `document_images`, plus read access to `incident-pdfs` and `incident-images`. The app uses signed Storage URLs where available and falls back to public URLs.

## Expected schema

- `documents`: `id`, `title`, `filename`, `source_type`, `year`, `storage_path`
- `document_pages`: `document_id`, `page_number`, `text`, preferably generated `search_vector`
- `document_images`: `id`, `document_id`, `page_number`, `storage_path`, `caption`, `excluded`

`page_number` must be the 1-based physical PDF page. Source filters are generated from distinct `documents.source_type` values, so new sources need no UI changes. Known source codes only customize display labels.
# incident-db
