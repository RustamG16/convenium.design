# The Folio questionnaire — paste this into your AI

Copy everything below the line into ChatGPT, Claude, Gemini or any assistant you use. Answer
its questions in your own words, in any language. When it prints the final JSON block, copy
the whole block and paste it into Folio.

---

You are helping me build my personal portfolio profile for a service called Folio. Your job is
to interview me, then produce one JSON file. Follow these rules exactly.

**How to interview me**
1. First ask me, in one message: my name, what I do in one sentence, who my site is for, and
   what I want it to achieve (get hired, get clients, find collaborators, press, academic,
   personal). Then tell me which role you think fits best from this list and ask me to
   confirm or correct it: software engineer, designer, visual creative (photo, illustration,
   3D, motion), writer or journalist, founder or operator, consultant or coach, researcher or
   academic, student or early-career.
2. Then go topic by topic, one topic per message, asking only for what is still missing:
   experience → projects or work pieces → education → skills → publications, talks or awards
   (only if relevant to my role) → testimonials (only if I have any) → links and contact →
   design preferences.
3. Keep my wording. Do not polish me into marketing language. Do not add adjectives I did not
   use.
4. Never invent anything. If I do not know a date, a company or a number, write `null`. Never
   guess. Do not fill fields to make the profile look complete.
5. Respect limits: `summary` fields at most 600 characters, `headline` at most 90 characters,
   at most 12 projects, 24 work pieces, 10 experience entries, 8 skills groups, 6
   testimonials, 12 links.
6. For design preferences, ask me these and only these, in plain words: three words that
   describe the feeling I want; two or three sites, brands or artists whose look I admire (or
   "none"); anything I dislike on websites; whether I like dark or light pages, or no
   preference; how much movement I want (none, calm, lively); the tone of voice I want (plain,
   warm, bold, formal). Do not ask me about fonts, colours or layouts.
7. If I say "skip" for a topic, move on and leave it `null` or empty.
8. Answer in the language I write in. Keep the JSON keys in English as given.

**How to finish**
When nothing important is missing, print exactly one fenced code block labelled `json` that
validates against the schema below, and print nothing after it. Every field in the schema must
be present; use `null` or `[]` when unknown. Set `meta.generatedBy` to your own model name.

**The schema (shape to produce)**

```json
{
  "meta": { "schemaVersion": 1, "generatedBy": "string", "language": "en", "createdAt": "YYYY-MM-DD" },
  "person": {
    "name": "string", "pronouns": "string|null", "headline": "string <= 90 chars",
    "summary": "string <= 600 chars", "location": "string|null", "languages": ["string"],
    "availability": "string|null", "photoDescription": "string|null"
  },
  "intent": { "goal": "hired|clients|collaborators|press|academic|personal", "audience": "string", "callToAction": "string|null" },
  "role": { "primary": "engineer|designer|visual|writer|founder|consultant|researcher|student", "secondary": "same set|null", "selfDescribed": "string" },
  "experience": [ { "organization": "string", "title": "string", "start": "YYYY-MM|null", "end": "YYYY-MM|null|\"present\"", "location": "string|null", "summary": "string <= 600", "highlights": ["string"], "visibility": "public|private" } ],
  "projects": [ { "name": "string", "role": "string|null", "year": "YYYY|null", "summary": "string <= 600", "outcome": "string|null", "url": "string|null", "tags": ["string"], "mediaDescription": "string|null", "visibility": "public|private" } ],
  "work": [ { "title": "string", "kind": "photo|illustration|3d|motion|film|writing|product|other", "year": "YYYY|null", "caption": "string|null", "url": "string|null", "mediaDescription": "string|null", "visibility": "public|private" } ],
  "education": [ { "institution": "string", "degree": "string|null", "field": "string|null", "start": "YYYY|null", "end": "YYYY|null", "note": "string|null", "visibility": "public|private" } ],
  "skills": [ { "group": "string", "items": ["string"] } ],
  "recognition": { "publications": [ { "title": "string", "venue": "string|null", "year": "YYYY|null", "url": "string|null" } ], "talks": [ { "title": "string", "event": "string|null", "year": "YYYY|null", "url": "string|null" } ], "awards": [ { "title": "string", "by": "string|null", "year": "YYYY|null" } ] },
  "testimonials": [ { "quote": "string <= 300", "name": "string", "role": "string|null", "visibility": "public|private" } ],
  "links": [ { "label": "string", "url": "string" } ],
  "contact": { "email": "string|null", "showEmail": false, "preferForm": true },
  "preferences": {
    "vibe": ["three", "words", "max"], "references": ["string"], "avoid": ["string"],
    "colorFeeling": "dark|light|none", "motionAppetite": "none|calm|lively",
    "tone": "plain|warm|bold|formal"
  }
}
```
