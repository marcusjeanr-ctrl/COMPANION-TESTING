// Conservative objective identity. Word order, actors, numbers and extra clauses remain significant.
function questObjectiveKey(value) {
    const text = String(value || '');
    const cache = activeReadPass ? memoRead(activeReadPass.chat, 'questObjectiveKeys', () => new Map()) : null;
    if (cache?.has(text)) return cache.get(text);
    let t = text.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\b(?:lord|lady|sir)\s+/g, '');
    if (/\b(?:permission|approval|consent)\b/.test(t)) {
        t = t.replace(/^(?:get|gain|secure|earn|win|receive|obtain)\b/, 'obtain')
            .replace(/^obtain\s+(.+?)'s\s+(?:permission|approval|consent)\b/, 'obtain permission from $1')
            .replace(/\b(?:approval|consent)\b/g, 'permission')
            .replace(/\bfor (?:a |the )?(?:trip|journey|visit) to\b|\bto make (?:a |the )?(?:trip|journey) to\b/g, 'to travel to');
    }
    t = t.replace(/^(?:fix|mend)\b/, 'repair').replace(/^locate\b/, 'find')
        .replace(/\b(?:a|an|the)\b/g, '').replace(/[^\p{L}\p{N}']+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (cache && cache.size < 512) cache.set(text, t);
    return t;
}

function questPlaceCompatible(a, b) {
    if (!a || !b || relSameWords(a, b)) return true;
    const norm = text => lockKey(text).replace(/[›→>,/]+/g, ' ').replace(/\s+/g, ' ').trim();
    const A = norm(a), B = norm(b), short = A.length < B.length ? A : B, long = A.length < B.length ? B : A;
    return short.split(' ').length >= 2 && long.startsWith(short + ' ');
}

function questMatch(a, b) {
    if (!a || !b) return false;
    if (a.giver && b.giver && !relSameWords(a.giver, b.giver)) return false;
    if (!questPlaceCompatible(a.where, b.where)) return false;
    const ak = questKey(a.name || a.key), bk = questKey(b.name || b.key);
    if (ak && ak === bk) return true;
    if ((Array.isArray(a.questAliases) ? a.questAliases : []).some(n => questKey(n) === bk) || (Array.isArray(b.questAliases) ? b.questAliases : []).some(n => questKey(n) === ak)) return true;
    const objective = questObjectiveKey(a.objective);
    if (!objective || objective !== questObjectiveKey(b.objective)) return false;
    // A changed title needs independent context; a generic unanchored instruction is insufficient.
    return !!((a.giver && b.giver) || (a.where && b.where));
}

function questUnique(list) {
    const out = [];
    for (const q of list) {
        const matches = out.filter(x => questMatch(x, q) && (!x.cls || !q.cls || x.cls === q.cls));
        if (matches.length !== 1) { out.push({ ...q }); continue; }
        const row = matches[0];
        for (const [key, value] of Object.entries(q)) {
            if (key === 'where' && row.where && value && row.where.length > value.length) continue;
            if (value !== null && value !== undefined && value !== '') row[key] = value;
        }
    }
    return out;
}
