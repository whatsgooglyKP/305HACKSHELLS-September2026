# Miami-Dade Single Mother Financial Stability Agent

**An AI teammate that turns School Readiness, ACCESS, 211, and night-shift transit into three next actions — not five websites between her and the paycheck.**

305 HackShells · EmpowHER · September 2026 · Miami-Dade County (The 305)

[Demo video](https://youtu.be/hLl717lGIPI) · [GitHub](https://github.com/whatsgooglyKP/305HACKSHELLS-September2026) · [Slides](https://docs.google.com/presentation/d/1-0cgTHTyrWrCt-dIuzws9s8GMLz6865gQorswhQkOR0/edit?usp=sharing)

---

## Inspiration

I was motivated because I am in a relationship with a single mother, and one of the reasons I care so deeply about her is the strength she shows day in and day out.

I have tried to apply for government assistance myself. It is an arduous process. I could not imagine doing it while also worrying that a missed letter or a dropped childcare slot could put housing — and stability with her kids — at risk.

In Miami-Dade that is not a hypothetical.

- About **two in five** households with children here are single-parent homes.
- United Way Miami’s ALICE data says **84%** of single-female-headed households with children cannot cover the basics.
- MIT’s living wage is about **$42/hour** for one adult and one child, and about **$52/hour** for one adult and two kids.
- Infant care runs on the order of **$13,500** a year.

The programs exist — School Readiness at the Early Learning Coalition of Miami-Dade/Monroe, DCF ACCESS, WIC, 211 / United Way Miami / JCS, Head Start, VPK, Miami-Dade Transit — but they live on five websites, with six-month revalidations, PDFs, and letters she is supposed to decode on a break.

Missing one step can cost the job that was supposed to get her out.

This project is a brain that can hold that maze at once. Not another resource directory.

---

## What it does

The agent turns a messy week of benefits, childcare, and shift work into **at most three next actions**: what to do, where (portal, phone, office), by when, and what to bring.

### Six functions

Same spec on the Gemma path and on the hosted Gemini demo.

| # | Function | What she gets |
|---|---|---|
| 1 | **Letter reader** | Paste or describe a DCF, ELC, M-DCPS, or landlord notice. The agent names the sender, the deadline, the documents, and what happens if she misses it. |
| 2 | **Eligibility map** | From ZIP, kids’ ages, hours, and a rough income band, it maps School Readiness, SNAP / TANF / Medicaid, WIC, Head Start / Early Head Start, VPK, and 211 rent/utility help. It never guarantees approval. |
| 3 | **Revalidation tracker** | Flags the ELC six-month revalidation, explains that **Active is not a paid Monday seat**, and drafts the change-of-hours note so a new night shift does not break the 20-hour rule. |
| 4 | **Document checklist** | Checks a pay stub, lease, birth record, or employment letter against the official packet and marks HAVE / MISSING / UNCLEAR. |
| 5 | **Shift-and-transit planner** | Handles “I start nights at a Beach hotel / MIA Monday, two kids, ZIP 33147.” It does not pretend 8 a.m.–3 p.m. center care solves a night shift. Metrobus / Metrorail are constraints. |
| 6 | **Private phone teammate** | Short answers. No passwords. Income, kids, and status treated as sensitive. Always hands her ELC CCR&R **305-646-7220**, **211**, or DCF ACCESS, plus a one-line script for the clerk. |

### Language lock

Default UI and starter prompts stay English.

- English in → English out
- Spanish in → Spanish out
- Haitian Creole in → Haitian Creole out
- Unclear → English

Program names stay in English inside every reply.

### What it is not

Not DCF, not ELC, not M-DCPS, not a lawyer, not a caseworker with authority. Human review stays at those offices.

---

## How we built it

- **Problem lock:** Miami-Dade coordination gap — subsidy + benefits + transit + shift work as one workflow.
- **Hosted demo:** React / Express app plus Google Cloud Agent Platform.
- **Live model:** Gemini.
- **Tools:** search + URL context on allowlisted Miami-Dade / Florida pages (`elcmdm.org`, Family Portal / ACCESS, 211 Miami, M-DCPS, Miami-Dade Transit).
- **Gemma path:** `gemma/letter_reader.py` runs the same six-function prompt on a `gemma-*` model id so the GDG / Kaggle chip is real, not a caption.
- **Product is the prompt:** three-action output, crisis routing (211 first; 911 / Florida Abuse Hotline if a child is in danger), hard geofence, language match.
- **Offline reasoner:** if the API is down, a Miami-Dade rule engine still answers the core scenarios instead of going blank.

### Run the demo (no API key required)

```bash
git clone https://github.com/whatsgooglyKP/305HACKSHELLS-September2026.git
cd 305HACKSHELLS-September2026
npm install
npm run dev
