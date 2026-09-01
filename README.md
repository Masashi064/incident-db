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
# Incident taxonomy integration

Search results can display validated taxonomy 1.2 incident classifications and
filter page results by incident tags. Page results are mapped to an incident only
when `document_id` matches and `start_page <= page_number <= end_page`; tags are
never joined directly to unrelated document pages.

The browser continues to use the existing anonymous Supabase key. If tag options
are empty while classifications exist, run
`sql/frontend_incident_taxonomy_select.sql` manually in Supabase. It grants SELECT
access to incident page boundaries and to non-rejected taxonomy 1.2 classifications
and AI tags; it adds no write policy.

Tag filters use OR semantics within one category and AND semantics across
categories. Taxonomy reads are centralized and cached briefly on the server to
avoid per-result requests.
