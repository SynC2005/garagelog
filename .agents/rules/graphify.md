---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions, and update it immediately after modifying files.
---

## graphify

Proyek GarageLog memiliki knowledge graph graphify di `graphify-out/`.

Aturan:
- **Auto-Update WAJIB**: Setiap kali selesai melakukan perubahan, pembuatan, atau penghapusan file kode dalam sesi tugas, agen **WAJIB LANGSUNG** mengeksekusi `graphify update .` di terminal sebelum menyelesaikan respon atau mengakhiri turn. Perintah ini berjalan cepat (AST-only, tanpa biaya API/LLM) dan memastikan knowledge graph (`graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.html`) selalu sinkron dan mutakhir dengan perubahan kode terbaru.
- Untuk pertanyaan arsitektur dan codebase, ketika `graphify-out/graph.json` ada, jalankan `graphify query "<question>"` (CLI) atau `query_graph` (MCP). Gunakan `graphify path "<A>" "<B>"` / `shortest_path` untuk relasi dan `graphify explain "<concept>"` / `get_node` untuk konsep terfokus.
- Jika `graphify-out/wiki/index.md` tersedia, baca wiki tersebut untuk navigasi terstruktur.
- Baca `graphify-out/GRAPH_REPORT.md` hanya untuk tinjauan arsitektur umum jika query/path belum memberikan konteks memadai.

