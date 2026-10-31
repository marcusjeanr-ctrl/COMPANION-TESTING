# Selected RC — NPC voice notes (item 16)

Open dossiers can suggest short/long dialogue lines only after two of that NPC's
own quoted `[D:Name]` lines. Exact names and unambiguous first-name aliases are
supported; ambiguous aliases and narrator descriptions do not seed notes. No
personality or private knowledge is inferred. Suggestions are visibly unaccepted.
Save/accept/edit/clear are explicit user actions. Ordinary refreshes preserve an
unsaved draft in memory. Accepted one-line notes live in optional per-chat
`playNotes.voice` keys (maximum 60); old stores load without it. Reaching capacity
rejects a new note, never evicts an existing accepted note. Clearing affects only
the user's selected note. Reports/messages/schema versions are untouched.

The independent reminder defaults OFF. It uses accepted notes only for the
existing present-character list, within the existing spare context allowance; accepted notes cannot displace existing lore. Default
prompt fixtures remain unchanged; opted-in voice text adds at most 240 characters.
Files: backend optional notes read/save helpers/RPC and hint; frontend dossier UI,
settings/suggestion helper; tests/Chromium; four dictionaries. Tests cover no/own
and ambiguous dialogue, unaccepted suggestions, edit/clear, sparse old stores,
current-cast ownership, save/reload, actual interceptor off/on/off identity and
spare-budget rejection. No automatic model request or generated note persistence.
