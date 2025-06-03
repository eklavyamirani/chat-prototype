# Functional Requirements Document  
**Project**: Chat Prototype with `llama.cpp` + OpenAI-compatible Back-ends  
**Version**: 0.5
**Purpose**: Define **unambiguous** functional requirements for a chat application that supports  
1) local inference via `llama.cpp` and  
2) any endpoint implementing the OpenAI Chat API,  
including native function calling and Model Context Protocol (MCP).

---

## 1  Scope
A single-user desktop/web client that lets the user chat with an LLM, call native functions, and swap between *local* and *remote* back-ends **at startup**. Reliability, multi-user support, and advanced persistence are out of scope for this phase. The conversation may include one or more LLM **agents**, enabling group‑chat style interactions where each agent acts as a distinct participant.

---

## 2  Definitions
| Term | Meaning |
|------|---------|
| **Back-end** | LLM inference provider. Either `llama.cpp` (local) or an HTTP service that speaks the OpenAI Chat API. |
| **MCP** | Model Context Protocol v1 message schema. |
| **Function Call** | JSON object in the assistant response that requests execution of a registered native function. |
| **Agent** | A distinct LLM instance with its own identity and parameters, participating as an independent speaker in the conversation. |
| **Agent Context Window** | The collection of recent messages maintained separately for each agent, truncated when token limit is reached. |

---

## 3  Constraints
* OS: macOS or Linux.  
* GUI or CLI is allowed, but a **Settings** UI must exist (see FR11–FR15, FR24).  
* Context length limited to each agent’s max tokens (enforced per-agent).  
* No hot‑switching back‑ends mid‑session **for any given agent**; different agents may use different back‑ends simultaneously.  
* Config file may store API keys in plain text; the UI **shall** warn the user to keep file permissions restrictive.

---

## 4  Non-Goals
* User authentication.  
* Multi-user chat rooms.  
* Remote retry / SLA logic.  
* Containerization or deployment packaging.

---

## 5  Functional Requirements

| ID  | Requirement |
|-----|-------------|
| **FR0** | The system **shall** support pluggable LLM back-ends that conform to the OpenAI Chat API (`POST /v1/chat/completions`). |
| **FR1** | The system **shall** accept user input as free-form text. |
| **FR2** | The system **shall** stream assistant responses to the UI in real time (token or line granularity). |
| **FR3** | When the model requests a function, the system **shall** execute the function and supply the result to the next prompt. |
| **FR4** | The system **shall** parse assistant messages to detect function-call JSON objects. |
| **FR5** | All message exchanges **shall** use MCP-compliant role and content fields. |
| **FR6** | The system **shall** allow registration of native functions via JSON schemas (name, description, arguments). |
| **FR7** | The system **shall** maintain in-session context for coherent conversation until the session ends or the model’s context window is exceeded. |
| **FR8** | The UI **shall** display messages chronologically: user → assistant → function (if any) → assistant. |
| **FR9** | The user **shall** be able to specify `backend_type`, `base_url`, `model`, `api_key`, and `llama.cpp` flags via config file **or** environment variables. |
| **FR10** | The system **shall** surface readable errors for invalid API keys, unreachable endpoints, or mis-configuration. |
| **FR11** | If `$HOME/.llm_chat/config.(json\|yaml)` exists, the system **shall** load it at startup; otherwise, the UI **shall** open a Settings screen for manual entry. |
| **FR12** | After manual entry, the system **shall** persist the configuration to `$HOME/.llm_chat/config.(json\|yaml)` (creating or overwriting the file). |
| **FR13** | The configuration file **shall** be read **only** at startup; changing it requires application restart. |
| **FR14** | Environment variables **shall** override conflicting values in the configuration file (at minimum: `LLM_CHAT_API_KEY`). |
| **FR15** | The UI **shall** provide **Import** (load existing JSON/YAML) and **Export** (download current settings) actions. |
| **FR16** | The user **shall** choose the back-end (`local` or `openai`) **before** the first chat message; back-end cannot change during an active session. |
| **FR17** | The system **shall** support configuring and running multiple LLM agents within a single conversation, each maintaining an independent context window. The UI **shall** label each agent clearly and display their messages chronologically. |
| **FR18** | The configuration file **shall** define an array `agents[]`; each element must include `name`, `backend_type`, `model`, and may optionally include `system_prompt`, `api_key`, and `llama_flags`. |
| **FR19** | The system **shall** truncate each agent’s context when its token limit is exceeded, using oldest‑first removal. |
| **FR20** | Any agent may request a function call; the system **shall** serialize and execute calls in the order they are received within a single turn. |
| **FR21** | Assistant streaming with multiple agents **shall** occur sequentially in the agent order defined in `agents[]`. |
| **FR22** | If a single agent encounters an API/back‑end error, the system **shall** continue the session, display an error message in place of that agent’s reply, and allow other agents to proceed. |
| **FR23** | The system **shall** log timestamped user messages, agent replies, and function invocations to `~/.llm_chat/session.log`. |
| **FR24** | The Settings UI **shall** allow users to add, edit, delete agents and to import/export individual agent configurations. |
| **FR25** | The config file **shall** support an optional global `max_agents` value; if exceeded at startup, the application **shall** refuse to launch and display an explanatory error. |

---

## 6  Open Questions
*(None – all deferred items moved to future scope.)*

---