#!/usr/bin/env python3
"""Offline letter reader for judges.

The README used to point here for a Gemma model call. No model file is
bundled, and the Google Cloud demo is offline. This script keeps the same
contract: at most three next actions, crisis routing first, no API key.
"""

import sys

CRISIS = ("abuse", "abused", "hit", "hitting", "beating", "danger", "scared", "violence", "unsafe", "golpe", "abuso", "vyolans", "locked out", "nowhere to sleep", "evict")


def detect_lang(text, explicit):
    if explicit in ("en", "es", "ht"):
        return explicit
    lower = text.lower()
    if any(w in lower for w in ("kijan", "mwen", "pitit", "kreyol")):
        return "ht"
    if any(w in lower for w in ("cómo", "como puedo", "cuidado", "niños", "el subsidio")):
        return "es"
    return "en"


def answer(text, zip_code="33142", kids="one child", lang="en"):
    lower = text.lower()
    if any(word in lower for word in CRISIS):
        if lang == "es":
            return "Ruta de seguridad. No se llamó a un modelo.\n1. Si hay peligro ahora, llama al 911.\n2. Línea de abuso de Florida: 1-800-962-2873.\n3. Esta noche: JCS 211 o 305-631-4211, y Homeless Trust 1-877-994-4357."
        if lang == "ht":
            return "Chemen sekirite. Pa gen modèl.\n1. Si gen danje kounye a, rele 911.\n2. Liy abi Florid: 1-800-962-2873.\n3. Aswè a: JCS 211 oswa 305-631-4211, ak Homeless Trust 1-877-994-4357."
        return "Safety path. No model was called.\n1. If you are in danger now, call 911.\n2. Florida Abuse Hotline: 1-800-962-2873.\n3. Tonight: JCS 211 or 305-631-4211, and Miami-Dade Homeless Trust 1-877-994-4357."
    sender = "Notice you pasted"
    if any(w in lower for w in ("elc", "school readiness", "child care", "childcare")):
        sender = "Early Learning Coalition of Miami-Dade/Monroe"
    elif any(w in lower for w in ("dcf", "access", "snap", "medicaid")):
        sender = "DCF ACCESS"
    elif any(w in lower for w in ("landlord", "rent", "evict")):
        sender = "Housing notice"
    return (
        f"Function: letter reader\nSender guess: {sender}\nZIP {zip_code}. {kids}\n"
        "1. Write the date on the letter onto a calendar before the shift.\n"
        "2. Call ELC CCR&R at 305-646-7220 if it is childcare, or 211 if it is rent or food.\n"
        f"3. Bring ID, the letter, proof of address in {zip_code}, and the child's age.\n"
        "This is a demo map, not an eligibility decision."
    )


def main():
    text = " ".join(sys.argv[1:]).strip() or sys.stdin.read().strip()
    if not text:
        print("Paste a letter as an argument, or pipe it on stdin.")
        return 1
    print(answer(text, lang=detect_lang(text, "")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
