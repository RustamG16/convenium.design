# Chat-First Route and Control Contract

## Route ownership

| Route | Owner | Primary surface |
|---|---|---|
| `#/new` | chat | empty composer with one primary action |
| `#/chats/{chatId}` | chat | standalone conversation |
| `#/projects/{projectId}` | project | project chat default |
| `#/projects/{projectId}/chats/{chatId}` | chat | project conversation |
| `#/projects/{projectId}/constructor` | constructor | guided five-stage workflow |
| `#/projects/{projectId}/files` | files | artifact list and optional right preview |
| `#/projects/{projectId}/files/{artifactId}` | files | selected artifact and preview |
| `#/knowledge` | knowledge | searchable source library |
| `#/agents` | agents | one-role-at-a-time inspector |
| `#/settings` | settings | supported preferences and accurate status |

## Controls

Sidebar controls create/search/open chats, expand projects/folders, and expose rename/move/archive/restore menus with keyboard equivalents and undo. The composer is shared by all chat surfaces. Chat cards expose suggested answers, editable brief, Start work, Continue, and Request changes. Project files open a right preview without destroying chat context. Constructor has synchronized list/canvas and one contextual inspector.

## Legacy

Work maps to its conversation; Plan, Configure, and System map to Constructor; Results and Outputs map to Files & Results. Invalid or cross-owner IDs render an explicit recovery state and never substitute another record.
