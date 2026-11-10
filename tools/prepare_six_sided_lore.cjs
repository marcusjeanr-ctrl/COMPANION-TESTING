// Convert only Six-Sided slash-delimited activation keys for Lumiverse's raw-regex matcher.
const fs = require('node:fs');
const assert = require('node:assert/strict');
function prepare(book) {
    assert(book && book.entries && Array.isArray(book.originalData?.entries), 'Expected paired Six-Sided lorebook representations');
    const out = structuredClone(book);
    let changed = 0;
    const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const entry of Object.values(out.entries)) {
        const keys = [...entry.key, ...entry.keysecondary];
        if (!keys.some(key => /^\/[\s\S]*\/i$/.test(key))) continue;
        assert(!entry.caseSensitive && !entry.matchWholeWords, 'Mixed case/whole-word semantics require explicit conversion');
        const convert = key => {
            if (!key.startsWith('/')) return escape(key);
            const end = key.lastIndexOf('/');
            assert(end > 0 && key.slice(end + 1) === 'i', 'Unsupported regex flags');
            const raw = key.slice(1, end);
            new RegExp(raw, 'i');
            return raw;
        };
        entry.key = entry.key.map(convert);
        entry.keysecondary = entry.keysecondary.map(convert);
        entry.use_regex = true;
        entry.caseSensitive = false;
        entry.matchWholeWords = false;
        entry.extensions = { ...entry.extensions, use_regex: true, case_sensitive: false,
            match_whole_words: false, six_sided_host_activation: true };
        const paired = out.originalData.entries.find(e => String(e.id) === String(entry.uid));
        assert(paired, 'Missing paired entry ' + entry.uid);
        paired.keys = [...entry.key];
        paired.secondary_keys = [...entry.keysecondary];
        paired.case_sensitive = false;
        paired.match_whole_words = false;
        paired.use_regex = true;
        paired.extensions = { ...paired.extensions, use_regex: true, case_sensitive: false,
            match_whole_words: false, six_sided_host_activation: true };
        changed++;
    }
    out.name = 'Mushoku Tensei — Six-Sided World — Lumiverse';
    out.description = out.originalData.description;
    for (const original of Object.values(book.entries)) {
        const entry = out.entries[String(original.uid)];
        assert.equal(entry.content, original.content);
        assert.equal(entry.disable, original.disable);
        assert.equal(entry.constant, original.constant);
        assert.equal(entry.selective, original.selective);
        assert.equal(entry.order, original.order);
        assert.equal(entry.position, original.position);
    }
    return { book: out, changed };
}
module.exports = { prepare };
if (require.main === module) {
    const [, , input, output] = process.argv;
    assert(input && output && input !== output, 'Usage: node tools/prepare_six_sided_lore.cjs INPUT OUTPUT');
    const result = prepare(JSON.parse(fs.readFileSync(input, 'utf8')));
    fs.writeFileSync(output, JSON.stringify(result.book, null, 2) + '\n');
    console.log(JSON.stringify({ entries: Object.keys(result.book.entries).length, converted: result.changed }));
}
