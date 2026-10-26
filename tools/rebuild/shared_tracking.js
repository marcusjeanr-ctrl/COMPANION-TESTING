function reportNumber(value) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return NaN;
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
}

function gearPendingState(value, includeUnequipped = false) {
    const state = String(value ?? '');
    return /\b(?:offered|presented|held out|proposed|planned|not (?:yet )?(?:taken|accepted))\b/i.test(state) ||
        (includeUnequipped && /\bnot (?:yet )?(?:equipped|held|worn)\b/i.test(state));
}
