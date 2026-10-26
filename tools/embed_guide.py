#!/usr/bin/env python3
"""Copies GUIDE.md (and GUIDE.pt-BR.md, GUIDE.es.md) into dist/frontend.js, so the in-panel Guide shows
the same text. Since 2.1 this also embeds the interface translations; see tools/embed_i18n.py.

Run it after editing a guide:   python3 tools/embed_guide.py
"""
import pathlib
import runpy

runpy.run_path(str(pathlib.Path(__file__).resolve().parent / "embed_i18n.py"), run_name="__main__")
