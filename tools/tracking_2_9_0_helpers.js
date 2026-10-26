// Shared local reconciliation primitives; no model calls or persistent cache.
function trackingWords(value) {
    const stop = new Set(['the', 'and', 'with', 'for', 'from', 'into', 'your', 'you', 'this', 'that', 'at', 'to', 'of', 'a', 'an']);
    return new Set(lockKey(value || '').split(/[^\p{L}\p{N}]+/u).filter(w => w && !stop.has(w)).map(w =>
        w.length > 5 ? w.replace(/ments?$/, '').replace(/ing$/, '').replace(/e$/, '') : w));
}

function questMatch(a, b) {
    if (!a || !b) return false;
    for (const field of ['giver', 'where']) if (a[field] && b[field] && !relSameWords(a[field], b[field])) return false;
    const ak = questKey(a.name || a.key), bk = questKey(b.name || b.key);
    if (ak && ak === bk) return true;
    // Renaming needs the same explicit objective and at least one established contextual anchor.
    const objective = questKey(a.objective);
    return !!objective && objective === questKey(b.objective) && ['giver', 'where'].every(f => a[f] && b[f] && relSameWords(a[f], b[f]));
}

function questDetailsLatest(chat) {
    return memoRead(chat, 'quest-details', () => {
        const rows = [];
        for (const m of relReadings(chat)) {
            const data = getSwipeData(m);
            if (!Array.isArray(data?.quests) || !data.quests.length) continue;
            for (const q of data.quests) {
                if (!q || !q.name || reportSpeculative(q)) continue;
                const exact = rows.filter(x => questKey(x.name) === questKey(q.name) && questMatch(x, q));
                const candidates = exact.length ? exact : rows.filter(x => questMatch(x, q));
                let row = candidates.length === 1 ? candidates[0] : null;
                const deadlineChanged = !row || (q.deadline && q.deadline !== row.deadline);
                if (!row) { row = { ...q }; rows.push(row); }
                for (const [key, value] of Object.entries(q)) if (value !== null && value !== undefined && value !== '') row[key] = value;
                // A deadline is anchored to the reply that actually supplied it, not a later partial report.
                if (deadlineChanged || row.readAt === undefined) { const at = chapterMark(m).minutes; row.readAt = Number.isFinite(at) ? at : null; }
            }
        }
        return rows;
    }).map(q => ({ ...q }));
}

function agendaSame(a, b) {
    if (a === b) return true;
    const A = trackingWords(a), B = trackingWords(b);
    if (!A.size || !B.size) return false;
    let n = 0; for (const word of A) if (B.has(word)) n++;
    // Never collapse two activities solely because one generic action word matches.
    return n >= 2 && n === Math.min(A.size, B.size);
}

function agendaClockPart(text) {
    const t = String(text || '').toLowerCase();
    const numeric = t.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm|o'clock|h)\b/);
    if (numeric) {
        let h = Number(numeric[1] ?? numeric[4]), m = Number(numeric[2] || 0), suffix = numeric[3] || numeric[5];
        if (m > 59 || h > 23 || (/^(am|pm)$/.test(suffix || '') && (h < 1 || h > 12))) return null;
        if (suffix === 'am' || suffix === 'pm') h = h % 12 + (suffix === 'pm' ? 12 : 0);
        return h * 60 + m;
    }
    const numbers = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    const word = t.match(/\b(half past|quarter past|quarter to)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/);
    if (word) return (numbers[word[2]] - (word[1] === 'quarter to' ? 1 : 0)) * 60 + (word[1] === 'half past' ? 30 : word[1] === 'quarter to' ? 45 : 15);
    if (/\bnoon\b/.test(t)) return 720;
    if (/\bmidnight\b/.test(t)) return 0;
    return null;
}

function agendaApproximate(text) {
    return /[~≈]|\b(?:about|around|approximately|roughly|sometime|few|couple)\b/i.test(String(text || ''));
}

function agendaWhen(due, when, at, hud = null, source = null) {
    if (/^\s*(?:right now|now|immediately)\s*$/i.test(when || due || '')) return at ?? null;
    const relative = String(when || due || '').match(/^\s*in\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|an?)\s+(minutes?|hours?)\s*$/i);
    if (relative && at !== null && at !== undefined) {
        const n = /^\d+$/.test(relative[1]) ? Number(relative[1]) : AGENDA_NUM[relative[1].toLowerCase()];
        return at + n * (/^hour/i.test(relative[2]) ? 60 : 1);
    }
    const wClock = agendaApproximate(when) ? null : agendaClockPart(when);
    const dClock = agendaApproximate(due) ? null : agendaClockPart(due);
    let clock = wClock ?? dClock;
    if (clock === null || agendaApproximate(when)) return null;
    // An extractor's precise `due` cannot silently replace an approximate story label.
    if (source !== null && wClock === null && when) {
        const text = String(source);
        const candidates = [...text.matchAll(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b|\b\d{1,2}\s*(?:am|pm|o'clock)\b|\b(?:half past|quarter past|quarter to)\s+\w+\b/gi)];
        if (!candidates.some(m => agendaClockPart(m[0]) === clock && !/(?:[~≈]|\b(?:about|around|approximately|roughly))\s*$/i.test(text.slice(Math.max(0, m.index - 24), m.index)))) return null;
    } else if (when && wClock === null) return null;
    const text = String(dClock === clock && due ? due : when || due || '');
    if (at === null || at === undefined) return null;
    const dayStart = Math.floor(at / 1440) * 1440;
    const dayOffset = /\bday after tomorrow\b/i.test(text) ? 2 : /\btomorrow\b/i.test(text) ? 1 : /\bnext week\b/i.test(text) ? 7 : 0;
    if (dayOffset) return dayStart + dayOffset * 1440 + clock;
    const day = text.match(/\bDay\s*:?\s*(\d+)\b/i);
    if (day && at < 300 * 360 * 1440 && !/\b(?:Year|Month|K\.?\d)/i.test(text)) return (Number(day[1]) - 1) * 1440 + clock;
    const clockText = `${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, '0')}`;
    const explicit = text.replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b|\b\d{1,2}\s*(?:am|pm|o'clock|h)\b|\b(?:half past|quarter past|quarter to)\s+\w+\b/i, clockText);
    const parsed = hmsParseWhen(explicit, at, hud);
    return parsed !== null && Number.isFinite(parsed) ? parsed : dayStart + clock;
}

function agendaScheduleCompatible(a, b, dueAt) {
    if (b.moved) return true;
    if (a.scheduleDay !== null && a.scheduleDay !== undefined && b.scheduleDay !== null && b.scheduleDay !== undefined && a.scheduleDay !== b.scheduleDay) return false;
    if (a.dueAt !== null && dueAt !== null) return a.dueAt === dueAt;
    if (!a.when || (!b.when && !b.due)) return true;
    const normalize = text => [...new Set(lockKey(text || '').replace(/\bmorning meal\b/g, 'breakfast')
        .replace(/\b(?:half past|quarter past|quarter to)\s+\w+\b|\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/g, '')
        .replace(/\b(?:this|the|today|by|at)\b/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean))].join(' ');
    if (normalize(a.when) === normalize(b.when || b.due)) return true;
    // A later explicit clock can refine a vague time; conflicting named days/dayparts remain separate.
    const slots = text => String(text || '').match(/\b(?:tomorrow|morning|afternoon|evening|tonight|sundown|sunset|dawn)\b/gi) || [];
    const A = slots(a.when).map(x => x.toLowerCase()), B = slots(b.when).map(x => x.toLowerCase());
    if (A.join('|') !== B.join('|') && A.length && B.length) return false;
    return (a.dueAt !== null || dueAt !== null) && (!A.length || !B.length);
}

function agendaScheduleDay(due, when, at, hud = null) {
    if (at === null || at === undefined) return null;
    const text = String(due || when || '');
    if (/\b(?:Day\s*:?\s*\d+|Month\s*\d+|Year\s*:|Armored Dragon Calendar)\b/i.test(text)) {
        const parsed = hmsParseWhen(text, at, hud);
        if (parsed !== null && Number.isFinite(parsed)) return Math.floor(parsed / 1440);
    }
    const t = String(when || '');
    if (!t) return null;
    return Math.floor(at / 1440) + (/\bday after tomorrow\b/i.test(t) ? 2 : /\btomorrow\b/i.test(t) ? 1 : /\bnext week\b/i.test(t) ? 7 : 0);
}
