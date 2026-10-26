#!/usr/bin/env python3
"""Copies the interface translations and the translated guides into dist/.

Sources (edit these, then run this script):
  i18n/{pt-BR,es,ru,tr}.json      English text → translation. Keys with {0}, {1}… are patterns for text
                                  built at run time; the same slots must appear in the translation.
  i18n/chat-keys.json             The keys the backend may translate in HTML it draws into the chat
                                  (the HUD card, Internal states). Only the extension's own words.
  GUIDE.md, GUIDE.pt-BR.md, GUIDE.es.md, GUIDE.ru.md, GUIDE.tr.md

Run:   python3 tools/embed_i18n.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = {"pt": "pt-BR", "es": "es", "ru": "ru", "tr": "tr"}


def blob(value):
    # UTF-8 as is (the bundles already are); </ is split so the text can never close a script tag.
    # U+2028/2029 are escaped: they are line breaks inside a JS string literal in older engines.
    out = json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return out.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def put(text, marker, value, path):
    pat = re.compile(r"/\* %s:BEGIN \*/.*?/\* %s:END \*/" % (marker, marker), re.S)
    if not pat.search(text):
        sys.exit(f"{path.name} has no {marker}:BEGIN / {marker}:END markers")
    return pat.sub(lambda _: f"/* {marker}:BEGIN */ {value} /* {marker}:END */", text, count=1)


dicts = {k: json.loads((ROOT / "i18n" / f"{v}.json").read_text(encoding="utf-8")) for k, v in LANGS.items()}
chat_keys = set(json.loads((ROOT / "i18n" / "chat-keys.json").read_text(encoding="utf-8")))
for code, d in dicts.items():
    for src, tr in d.items():
        if set(re.findall(r"\{\d\}", tr)) - set(re.findall(r"\{\d\}", re.sub(r"\{(\d)d\}", r"{\1}", src))):
            sys.exit(f"[{code}] the translation of {src!r} uses a slot the English text does not have")

fe_path = ROOT / "dist" / "frontend.js"
be_path = ROOT / "dist" / "backend.js"
fe = fe_path.read_text(encoding="utf-8")
be = be_path.read_text(encoding="utf-8")

def table(keep=lambda s: True):
    codes = list(LANGS)
    keys = sorted({s for d in dicts.values() for s in d if keep(s)})
    return {"langs": codes, "t": {s: [dicts[c].get(s, "") for c in codes] for s in keys}}


fe = put(fe, "I18N", blob(table()), fe_path)
be = put(be, "I18N", blob(table(lambda s: s in chat_keys)), be_path)

fe = put(fe, "GUIDE", blob((ROOT / "GUIDE.md").read_text(encoding="utf-8")), fe_path)
for code, marker in (("pt", "GUIDE_PT"), ("es", "GUIDE_ES"), ("ru", "GUIDE_RU"), ("tr", "GUIDE_TR")):
    g = ROOT / f"GUIDE.{LANGS[code]}.md"
    fe = put(fe, marker, blob(g.read_text(encoding="utf-8") if g.exists() else ""), fe_path)

fe_path.write_text(fe, encoding="utf-8")
be_path.write_text(be, encoding="utf-8")
print("Embedded: " + ", ".join(f"{LANGS[k]} {len(d)} strings" for k, d in dicts.items()) + f"; {len(chat_keys)} chat keys; guides.")
