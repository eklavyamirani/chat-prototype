# Technical Design Specification  
**Project**: Chat Prototype (React + .NET + PostgreSQL)  
**Document Version**: 1.0  
**Alignment**: FRD v0.4 (multi‑agent council)

---

## 1 High‑Level Architecture
```txt
┌─────────────┐   HTTPS / WebSocket   ┌────────────────────┐
│  React UI   │ ────────────────────▶ │  ASP.NET Core API  │
│ (Vite + TS) │ ◀──────────────────── │    Gateway         │
└─────────────┘     JSON / SSE        │   • REST & WS      │
        ▲                             │   • Agent mgr      │
        │                             └────────┬───────────┘
        │                                        │
        │                          Function calls│
        │                                        ▼
        │                       ┌────────────────────┐
        │                       │   Function Host    │
        │                       │   (C# class lib)   │
        │                       └────────┬───────────┘
        │                                 │
        │                        LLM requests│
        │                                 ▼
        │  (local)  ┌──────────────┐   (remote)  ┌──────────────┐
        └──────────▶│ llama.cpp C  │◀────────────│ OpenAI API   │
                    │ via P/Invoke │  HTTP        │ (any vendor) │
                    └──────────────┘              └──────────────┘
                                     │
                         Context & logs│
                                     ▼
                           ┌─────────────────┐
                           │ PostgreSQL 16   │
                           │  • sessions     │
                           │  • configs      │
                           │  • logs         │
                           └─────────────────┘
```

---

## 2 Component Breakdown

| Layer | Responsibilities | Key Tech |
|-------|------------------|----------|
| **React Front‑end** | Chat UI, settings CRUD, import/export, streaming render | Vite, React 18, TypeScript, `react-query`, `marked` |
| **API Gateway (.NET)** | REST + WS endpoints, agent orchestration, context truncation, function proxy, config CRUD | ASP.NET Core 8, SignalR, `System.Text.Json` |
| **Function Host** | Registry & execution of C# native functions behind JSON‑schema validation | .NET class‑library, `System.Text.Json.Nodes` |
| **LLM Providers** | · `LlamaCppProvider` (P/Invoke to `libllama.so`)  · `OpenAiProvider` (HTTP) | `DllImport`, `HttpClient` |
| **Persistence** | Config, sessions, logs | PostgreSQL 16 via `Npgsql` |

---

## 3 Data Model (PostgreSQL)

```sql
create table config (
    id serial primary key,
    json jsonb not null,
    inserted_at timestamptz default now()
);

create table session (
    id uuid primary key,
    started_at timestamptz default now(),
    config_id int references config(id)
);

create table message (
    id bigserial primary key,
    session_id uuid references session(id),
    agent_name text,
    role text,                -- user | assistant | tool
    content text,
    created_at timestamptz default now(),
    token_count int
);

create table function_log (
    id bigserial primary key,
    session_id uuid,
    agent_name text,
    function_name text,
    args jsonb,
    result jsonb,
    created_at timestamptz default now()
);
```

---

## 4 API Surface

### 4.1 REST Endpoints

| Method | Path | Payload | Purpose |
|--------|------|---------|---------|
| `GET`  | `/api/config` | – | Return active config |
| `POST` | `/api/config` | JSON | Save (overwrite) config |
| `POST` | `/api/import` | file | Import JSON/YAML config |
| `GET`  | `/api/export` | – | Download config |
| `GET`  | `/api/agents` | – | List agents |
| `POST` | `/api/chat` | `{sessionId?, userText}` | Create/continue session; returns `202` & `streamUrl` |

### 4.2 WebSocket / SignalR

Endpoint `/ws/{sessionId}`  

Server → Client events:
```jsonc
{ "type": "token",          "agent": "GPT‑4o",   "text": "Hello" }
{ "type": "function_call",  "agent": "Math",     "name": "add",  "args": { ... } }
{ "type": "function_result","agent": "Math",     "result": 42 }
{ "type": "error",          "agent": "Claude‑3", "message": "timeout" }
{ "type": "done",           "agent": "GPT‑4o" }
```

---

## 5 Core Flows

### 5.1 Chat Turn

1. React `POST /api/chat` → receives `streamUrl`.  
2. React opens WebSocket.  
3. Gateway spawns `InteractionCoordinator`.  
4. For each **agent** (config order):  
   a. Build MCP prompt (session ctx + user msg).  
   b. Call provider → stream tokens to WS.  
   c. Detect `function_call`; enqueue if any.  
   d. Persist message; truncate context if token limit reached.  
5. Execute queued function calls sequentially; broadcast results.  
6. Close WS when all agents complete.

### 5.2 Function Execution

* Validate args (`JsonSchema.Net`).  
* Invoke C# method (reflection).  
* Append result as `tool` message into agent context.

---

## 6 Context Management

* Per‑agent ring buffer in memory.  
* Token counting via `tiktoken_rust` FFI.  
* Drop oldest messages on overflow.

---

## 7 Configuration Handling

* Load `$HOME/.llm_chat/config.(json|yaml)` via `YamlDotNet`.  
* Schema‑validate on save/import.  
* Environment vars override (`LLM_CHAT_API_KEY`, etc.).  
* Settings UI wizard on first run.

---

## 8 Security

* Config file chmod 600; UI warns if broader.  
* API keys resolved at runtime if `env:` prefix.  
* WebSocket bound to `localhost` (MVP).

---

## 9 Logging & Monitoring

* `Serilog` to `~/.llm_chat/session.log` (rolled daily).  
* SQL logging via `Npgsql`.  
* Prometheus stub at `/metrics`.

---

## 10 Developer Setup

```bash
git clone <repo>
docker compose up   # launches web, api, db
```

* Llama models stored in `./models`.  
* Example `.env.development` supplied.

---

## 11 Key Libraries

| Area | Library | Version |
|------|---------|---------|
| React | react, react‑dom | 18.x |
| Build | vite | 5.x |
| Markdown | marked | 10.x |
| .NET | ASP.NET Core | 8.0 |
| JSON | System.Text.Json | built‑in |
| YAML | YamlDotNet | 13.x |
| Postgres | Npgsql | 8.x |
| Logging | Serilog | 3.x |
| Tokenizer | tiktoken_rust | latest |
| llama.cpp | git submodule | commit‑pinned |

---

## 12 Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| P/Invoke crashes | Isolate in separate process or AppDomain |
| Tokenizer latency | Cache counts; benchmark |
| High agent count | Enforce `max_agents`; sequential streaming |
| Plain‑text keys | User warning + restrictive file permissions |

---

## 13 Future Enhancements

* JWT auth & multi‑user DB.  
* Hot back‑end switching per agent.  
* Retry/exponential backoff for remote providers.  
* GPU offload for llama.cpp.  
* CI/CD & container images.
