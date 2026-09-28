import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const app = express();
app.use(express.json());

// Initialize Google GenAI Client with key validation
const getGeminiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  // Valid Google AI Studio keys typically start with AIzaSy
  if (!apiKey || (!apiKey.startsWith('AIzaSy') && apiKey.startsWith('AQ.'))) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize Google GenAI Client:', err);
    return null;
  }
};

const SYSTEM_PROMPT = `
You are the "Miami-Dade Single Mother Financial Stability Agent" (representing Miami/The 305). You serve single mothers and primary caregivers of children enrolled in or applying to Miami-Dade County Public Schools (M-DCPS) in Miami-Dade County, Florida (Miami area).

GOAL:
Turn fragmented local help into a short, doable plan. Every reply should end with at most THREE next actions, each with: what to do, where (portal, phone, office), by when, and what to bring or upload.

COMMUNITY AND TONE:
- Speak like a calm, straight neighbor, not a government brochure.
- Default to English. Switch to Spanish or Haitian Creole seamlessly if she writes in Spanish/Creole or asks. Offer Haitian Creole terms when relevant (e.g., "Sèvis Prepari pou Lekòl" for School Readiness), and say when a human at ELC can help in Creole/Spanish (ELC Miami-Dade/Monroe Family Support Hotline: English, Spanish, Haitian Creole; 305-646-7220).
- Never shame work hours, immigration questions, cash jobs, or "I don't know which form."
- Use first names of programs exactly: School Readiness (ELC of Miami-Dade/Monroe / Family Portal), DCF ACCESS Florida (SNAP, TANF, Medicaid), WIC, Head Start / Early Head Start, Florida VPK, JCS 211 Miami (Jewish Community Services of South Florida 211), Miami-Dade Community Action and Human Services Department (CAHSD), Miami-Dade Transit (Metrobus, Metrorail, Metromover).

THE SIX GEMMA FUNCTIONS — Use the matching one, or chain them:
1) LETTER READER: Identify sender (DCF ACCESS, ELC Miami-Dade/Monroe, M-DCPS, landlord, court), deadline, requested documents, and consequence of missing it. Output: "This letter is asking for X by DATE. If you miss it, Y happens. Do these 3 things."
2) ELIGIBILITY MAP: Collect only ZIP, child count/ages, work/school hours per week, lease status, income band. Map likely-fit programs. Say "likely eligible / maybe / probably not" and why. Never guarantee approval.
3) REVALIDATION TRACKER: School Readiness revalidation every 6 months. Report Change in Purpose of Care before 20-hour rule breaks. Draft note.
4) DOCUMENT CHECKLIST: Check against ELC Miami-Dade packet. Mark each item HAVE / MISSING / UNCLEAR. Tell exact form name on elcmdm.org.
5) SHIFT AND TRANSIT PLANNER: Hospitality (South Beach, Brickell, downtown), MIA airport, hospitals, warehouses, nights. Separate subsidy/waitlist from care covering tonight (Family Child Care Homes). Miami-Dade Transit constraints.
6) PRIVATE PHONE TEAMMATE: Sensitive phone chat, parking lot. Short answers. Never demand passwords or SSN.

BEHAVIOR RULES:
- If a child is in danger: call 911 or Florida Abuse Hotline 1-800-96-ABUSE.
- If immediate danger, housing tonight, or food tonight: lead with JCS 211 (305-631-4211) and Miami-Dade Homeless Trust (1-877-994-HELP).
- Refuse to lie; provide truthful wording that still works.
- HARD GEO RULE: Strictly Miami-Dade County, Florida (The 305). Never cite California (CalFresh, CalWORKs, 211OC, text 898211) or Orange County/Orlando (OCPS, Lynx).
- OUTPUT SHAPE:
  1. One-sentence read of her situation.
  2. Which of the six functions you just used.
  3. The eligibility or letter finding in plain words.
  4. THREE next actions, numbered (what, where, by when, what to bring).
  5. Official links/phones.
  6. Optional: 4-line script to read to clerk or paste into portal.
`;

// Helper: Extract neighborhood name from Miami ZIP code
const getMiamiNeighborhood = (zip: string): string => {
  const map: Record<string, string> = {
    '33142': 'Allapattah / Brownsville',
    '33147': 'Liberty City / West Little River',
    '33130': 'Brickell / Downtown Miami',
    '33125': 'Little Havana',
    '33127': 'Wynwood / Edgewater',
    '33139': 'South Beach (Miami Beach)',
    '33140': 'Mid-Beach',
    '33141': 'North Beach',
    '33138': 'Upper East Side / Little River',
    '33150': 'Little Haiti',
    '33161': 'North Miami',
    '33162': 'North Miami Beach',
    '33010': 'East Hialeah',
    '33012': 'Hialeah',
    '33013': 'Hialeah',
    '33014': 'Miami Lakes',
    '33030': 'Homestead',
    '33033': 'Florida City / Homestead',
    '33157': 'Perrine / Cutler Bay',
    '33177': 'South Miami Heights',
    '33176': 'Kendall',
    '33186': 'Kendall West'
  };
  return map[zip] || 'Miami-Dade County';
};

interface ReasonerOutput {
  reply: string;
  functionName: string;
}

// Comprehensive Dynamic Reasoner Engine (Miami-Dade / 305 Specialized)
const generateDynamicReasoningResponse = (message: string, context?: string): ReasonerOutput => {
  const userText = (message || '').trim();
  const lower = userText.toLowerCase();

  // Detect Language
  const isSpanish = /[¿¡]/.test(userText) ||
    /\b(hola|ayuda|necesito|hijos|niños|trabajo|alquiler|desalojo|guardería|carta|papeles|estatus|horas|semana|miami|ingresos|limpieza|efectivo|dormir|calle)\b/i.test(lower);
  const isCreole = /\b(bonjou|bonswa|mwen|ede|pitit|timoun|travay|kay|kreyol|kreyòl|lèt|èd|aswè|danjere|pase)\b/i.test(lower);

  // 1. SAFETY & CRISIS TRIGGER: Child Abuse or Domestic Violence
  if (/\b(abuse|abused|hit|hitting|beating|danger|scared|violence|unsafe|golpe|abuso|vyolans|bat|danjere)\b/i.test(lower)) {
    if (isSpanish) {
      return {
        functionName: 'Intervención de Emergencia y Protección Infantil',
        reply: `Por favor quédate en el auto con tus niños, pon los seguros y respira un momento. Tu seguridad y la de tus hijos es la prioridad absoluta en este momento, antes de cualquier trámite o papeleo.

### Tus 3 Pasos Inmediatos:
1. **Llamar al 911 de inmediato:** Si estás en peligro en este instante o te están siguiendo, llama al 911 para protección policial inmediata.
2. **Línea de Abuso de Florida:** Llama al **1-800-96-ABUSE** (1-800-962-2873) para reporte y apoyo confidencial disponible 24/7 en español.
3. **Albergue Seguro en Miami-Dade:** Llama al **JCS 211** (marca 211 o 305-631-4211) y pide conexión de emergencia con el albergue de violencia doméstica *The Lodge* o *Safespace Foundation*.

📞 **Teléfonos de Emergencia:**
- Emergencias: **911**
- Florida Abuse Hotline: **1-800-96-ABUSE (1-800-962-2873)**
- JCS 211 Miami: **211** o **305-631-4211**

💬 **Guión para la Operadora:**
*"Necesito ayuda y protección inmediata para mí y mis hijos en Miami-Dade. Por favor comuníquenme con un albergue seguro de emergencia ahora mismo."*`
      };
    }
    return {
      functionName: 'Safety Crisis & Child Protection',
      reply: `Please stay in your car with your children, keep the doors locked, and breathe for a moment. If you or your child are in immediate danger right now, call **911** immediately. Your safety and your child's safety come before any paperwork or program rules.

### Your 3 Immediate Next Steps:
1. **Call 911 Right Now:** If your partner is following you or anyone is in physical danger, ask for emergency police assistance.
2. **Florida Abuse Hotline:** Call **1-800-96-ABUSE** (1-800-962-2873) — available 24/7, confidential, in English, Spanish, and Creole.
3. **Emergency Shelter Tonight via JCS 211:** Call **211** (or 305-631-4211) and ask for immediate confidential transfer to *The Lodge* or *Safespace Foundation* domestic violence shelters in Miami-Dade.

📞 **Emergency Helplines:**
- Immediate Danger: **911**
- Florida Abuse Hotline: **1-800-96-ABUSE (1-800-962-2873)**
- JCS 211 Miami Helpline: **211** or **305-631-4211** (211miami.org)

💬 **Emergency Intake Script to Read:**
*"I need immediate safe emergency shelter and protection for myself and my children in Miami-Dade County. Please connect me to domestic violence crisis services right now."*`
    };
  }

  // 2. CRISIS TRIGGER: Homeless Tonight / Eviction / Food Tonight
  if (/\b(evict|eviction|street|homeless|nowhere to go|sleep tonight|tonight|hungry|food tonight|desalojo|en la calle|sin techo|esta noche|aswè)\b/i.test(lower)) {
    if (isSpanish) {
      return {
        functionName: 'Respuesta Rápida de Crisis Habitacional y Alimentos',
        reply: `Te escucho y no tienes que pasar por esto sola. Cuando enfrentas un desalojo hoy y no tienes dónde dormir esta noche, no podemos esperar por listas de espera de 6 meses. Aquí está cómo conseguimos refugio de emergencia y comida para ti y tus hijos hoy mismo en Miami-Dade.

### Tus 3 Pasos Inmediatos para Hoy:
1. **Llamar a la Línea del Miami-Dade Homeless Trust (1-877-994-4357):** Esta es la entrada central para camas de refugio familiar de emergencia en Miami-Dade. Llama inmediatamente para registrar a tu familia.
2. **Llamar al JCS 211 para Comida Hoy y Fondos de Desalojo:** Marca el **211** (o 305-631-4211) para ubicar bancos de alimentos abiertos hoy cerca de ti y pedir vales de prevención de desalojo de CAHSD.
3. **Contactar a M-DCPS Project UP-START:** Si tus hijos van a las escuelas públicas de Miami-Dade, llama al **305-995-7558**. Bajo la ley federal McKinney-Vento, tienen derecho a comida escolar gratis, transporte gratuito y no pueden sacarlos de su escuela.

📞 **Teléfonos de Ayuda Urgente:**
- Miami-Dade Homeless Trust: **1-877-994-4357 (1-877-994-HELP)**
- JCS 211 Miami: **211** o **305-631-4211** (211miami.org)
- M-DCPS Project UP-START: **305-995-7558**

💬 **Guión para la Operadora:**
*"Hola, soy madre con mis hijos en Miami-Dade y no tenemos un lugar seguro donde dormir esta noche. Necesitamos asistencia de emergencia con el Homeless Trust ahora mismo."*`
      };
    }
    return {
      functionName: 'Emergency Housing & Food Crisis',
      reply: `I hear you, and you don't have to face this alone. When you're facing eviction today and have nowhere to sleep tonight, we can't wait on 6-month waitlists. Here is how we get immediate shelter and emergency food for you and your kids in Miami-Dade today.

### Your 3 Next Steps for Today:
1. **Call the Miami-Dade Homeless Trust Helpline (1-877-994-4357):** This is Miami-Dade County's central intake for emergency family beds tonight. Call them immediately to register your family for intake.
2. **Call JCS 211 for Today's Food Pantries & CAHSD Eviction Funds:** Dial **211** (or 305-631-4211) to locate food distributions open in your area today and ask about Miami-Dade CAHSD emergency eviction prevention funds.
3. **Contact M-DCPS Project UP-START:** If your kids attend Miami-Dade Public Schools, call **305-995-7558**. Under federal McKinney-Vento law, your children receive immediate free school meals, free school uniforms, free transit passes, and guaranteed school stability.

📞 **Emergency Numbers:**
- Miami-Dade Homeless Trust: **1-877-994-4357 (1-877-994-HELP)**
- JCS 211 Miami Helpline: **211** or **305-631-4211** (211miami.org)
- M-DCPS Project UP-START (Student Assistance): **305-995-7558**

💬 **Intake Script to Read:**
*"Hello, I am a mother with children in Miami-Dade County facing imminent homelessness tonight. Please connect me to family emergency shelter and emergency food assistance right now."*`
    };
  }

  // 3. HARD GEOFENCE: California or Orange County / Orlando Entrapment
  if (/\b(898211|calfresh|calworks|211oc|california|orange county|ocps|orlando|lynx)\b/i.test(lower)) {
    return {
      functionName: 'Geofence Protection & Miami Redirection',
      reply: `Hold on—that number or program is outside our Miami-Dade area! Let's get you connected to the right local Miami agency instead of sending you down a dead-end.

**Key Local Miami Corrections:**
- **Do NOT text 898211** — that is Orange County, California. In Miami-Dade County, Florida, dial **211** or visit \`211miami.org\` (Jewish Community Services of South Florida).
- **CalFresh / CalWORKs** are California state programs. In Florida, your food and cash assistance program is **DCF ACCESS Florida (SNAP & TANF)**.
- **OCPS and Lynx** are in Orlando (Orange County, FL). Here in Miami, your school system is **M-DCPS** and your transit system is **Miami-Dade Transit (MDT)**.

### Your 3 Local Miami Next Steps:
1. **Call JCS 211 Miami:** Dial **211** or call **305-631-4211** directly for local rent relief, utility help, and food pantries across Miami-Dade.
2. **Apply for Food Assistance via ACCESS Florida:** Go to [myflfamilies.com/services/public-assistance/access-florida](https://www.myflfamilies.com/services/public-assistance/access-florida) for Florida SNAP food benefits.
3. **Apply for Miami-Dade Child Care Subsidies:** Visit the Florida Early Learning Family Portal at [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/) for the Early Learning Coalition of Miami-Dade/Monroe (ELC).

📞 **Local Miami-Dade Contacts:**
- JCS 211 Miami Helpline: **211** or **305-631-4211** (211miami.org)
- DCF ACCESS Florida Hotline: **1-850-300-4323**
- ELC of Miami-Dade/Monroe: **305-646-7220** (elcmdm.org)`
    };
  }

  // 4. FUNCTION 1: LETTER READER (Strict match only when the user is presenting a notice/letter)
  const isActualLetter = /\b(i got (this|a) (letter|message|notice)|warning notice|incomplete notice|received a (letter|notice)|review (this|my) (letter|notice)|audit (this|my) (letter|notice)|carta que me llegó|aviso que recibí|lèt mwen resevwa)\b/i.test(lower) ||
    (/\b(letter|notice|carta|aviso|lèt)\b/i.test(lower) && /\b(consecutive|deadline|incomplete|cancel|cancelled|terminate|paystubs|pay stubs)\b/i.test(lower));

  if (isActualLetter) {
    const dateMatch = userText.match(/\b(october|november|december|january|february|march|april|may|june|july|august|september|\d{1,2}\/\d{1,2})\s*\d{1,2}(,\s*\d{4})?/i);
    const deadline = dateMatch ? dateMatch[0] : 'the date stamped on your notice (typically 10-14 days)';
    const sender = lower.includes('elc') ? 'ELC of Miami-Dade/Monroe' : lower.includes('dcf') ? 'DCF ACCESS Florida' : 'your assistance agency';

    return {
      functionName: 'Function 1: Letter Reader',
      reply: `Let’s review this notice together so your application stays active and you don't lose your place in line.

**What This Notice Means:**
${sender} is warning you that your School Readiness waitlist spot or application will be **cancelled and terminated** if you do not submit consecutive 4-week pay verification by **${deadline}**. Because your status is currently 'Active', keeping your documents up to date is what keeps you in line for subsidized child care.

### Your 3 Next Steps Before ${deadline}:
1. **Collect Your 4 Weeks of Pay Verification:**
   - If you get pay stubs: gather recent pay stubs covering the last 4 consecutive weeks.
   - If you are paid in cash: download the official **'ELC Cash Employment Log'** from \`elcmdm.org\` and have your employer sign it.
2. **Upload to the Florida Early Learning Family Portal by ${deadline}:**
   - Log into [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/).
   - Open your pending case, and upload clear photos or PDF scans of each pay stub or signed cash log.
3. **Call ELC Family Support to Confirm Approval:**
   - Call **305-646-7220** (Press 2 for Spanish, 3 for Creole).
   - Give them your case number and ask: *"Can you verify that my 4 weeks of pay verification were received and my status is safe?"*

📞 **Official Portals & Contacts:**
- Florida Early Learning Family Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC Miami-Dade/Monroe Family Support Line: **305-646-7220**
- ELC Document Center: [elcmdm.org](https://www.elcmdm.org/)

💬 **Note to Paste in Portal:**
*"Hello, I have uploaded my consecutive 4 weeks of pay verification before ${deadline} to keep my School Readiness application active. Please review and confirm receipt. Thank you!"*`
    };
  }

  // 5. FUNCTION 3: REVALIDATION TRACKER
  if (/\b(revalidate|revalidation|active status|status is active|hours dropped|hours fell|change in purpose of care|under 20 hours|less than 20 hours|revalidar|lista de espera)\b/i.test(lower)) {
    return {
      functionName: 'Function 3: Revalidation Tracker',
      reply: `Let's protect your spot on the waitlist so this temporary change in hours doesn't cause you to lose your child care subsidy.

**Important Miami-Dade Rules to Know:**
1. **'Active' status means you are on the waitlist**, not that you have an enrolled child care seat yet. ELC removes families who do not revalidate every 6 months.
2. Florida School Readiness requires **at least 20 hours per week** of work or education. If your hours drop below 20, you must report a **'Change in Purpose of Care'** before ELC flags your file for non-compliance.

### Your 3 Next Steps:
1. **Check Your Revalidation Date:**
   - Log into [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/) and verify the exact date your 6-month revalidation is due.
2. **Submit a Change in Purpose of Care Request:**
   - If your hours dropped temporarily, submit a note along with a letter from your employer showing your standard schedule or an enrollment in training/classes to bridge the 20-hour requirement.
3. **Speak to an ELC Waitlist Specialist:**
   - Call ELC Miami-Dade at **305-646-7220** (Mon–Fri 8am–5pm). Confirm that your file is in good standing and has no document flags.

📞 **Official Portals & Contacts:**
- Florida Family Services Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC Miami-Dade/Monroe: **305-646-7220** (elcmdm.org)

💬 **Portal Update Note to Paste:**
*"Hello, I am updating my application to revalidate my School Readiness status. My scheduled hours are temporarily fluctuating, but my regular purpose of care remains active. I wish to maintain my Active status on the Miami-Dade waitlist. Thank you."*`
    };
  }

  // 6. FUNCTION 4: DOCUMENT CHECKLIST
  if (/\b(checklist|what papers|what documents|document packet|what to bring|cash employment|paid cash|old address|separation letter|papeles|documentos)\b/i.test(lower)) {
    const hasCash = /cash|efectivo|cleaning|limpieza|under the table/i.test(lower);
    const hasOldAddress = /old address|antigua dirección|lease|alquiler/i.test(lower);

    return {
      functionName: 'Function 4: Document Checklist',
      reply: `Here is a straightforward audit of your paperwork so your ELC Miami-Dade application is approved on the first pass without delays:

**Document Status Audit:**
- ✅ **[HAVE] Identification & Children's Records:** Florida ID and your children's birth certificates (or Form 680 immunization records) are ready.
- ⚠️ **[ACTION NEEDED] Proof of Miami-Dade Residency:** ${hasOldAddress ? 'Your old lease will be rejected immediately. You must provide a current FPL electric bill, Miami-Dade water bill, or a signed current lease showing your current Miami-Dade address.' : 'Current lease or FPL electric/water bill in your name.'}
- ⚠️ **[ACTION NEEDED] Income Proof (Cash Earnings):** ${hasCash ? 'Because you are paid in cash, you cannot submit pay stubs. ELC will reject plain handwritten notes. You MUST download and submit the official "ELC Cash Employment Log" signed by your employer.' : 'Submit 4 consecutive weeks of recent pay stubs.'}
- ⚠️ **[ACTION NEEDED] Single Parent Status:** If only you live with the children, provide a divorce decree, proof of the other parent's separate address, or an ELCMDM Notarized Letter of Separation.

### Your 3 Next Steps:
1. **Download the Cash Employment Log:**
   - Get the form from [elcmdm.org](https://www.elcmdm.org/) under Parent Resources, fill in your hours, and have your cleaning employer sign it.
2. **Download Current Utility Proof:**
   - Download your latest FPL electric or Miami-Dade water bill PDF showing your name and current address.
3. **Upload the Complete Packet Together:**
   - Submit all documents together at [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/).

📞 **Official Resources:**
- ELC Miami-Dade Forms Repository: [elcmdm.org](https://www.elcmdm.org/)
- Florida Early Learning Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC Miami Support Line: **305-646-7220**

💬 **Clerk Help Script:**
*"Hi, I am submitting my Florida ID, my children's birth certificates, my Miami-Dade utility bill for residency, and my completed ELC Cash Employment Log. Thank you!"*`
    };
  }

  // 7. FUNCTION 6: PRIVATE PHONE TEAMMATE
  if (/\b(parking lot|on my phone|confidential|safe to talk|privacy|private|ssn needed|immigration status|estacionamiento|parqueo|teléfono|seguro|privacidad)\b/i.test(lower)) {
    return {
      functionName: 'Function 6: Private Phone Teammate',
      reply: `You are completely safe to ask questions here—you never need to share your full legal name, your children's names, account passwords, or immigration status.

**The Facts About Privacy & Your Rights:**
- **Your Children's Rights:** Any child born in the United States qualifies for Florida School Readiness, Medicaid, and SNAP regardless of their parent's immigration status.
- **Public Charge Protections:** Applying for child care subsidies (ELC School Readiness), children's Medicaid, or food stamps (SNAP) on behalf of citizen children does **NOT** count against you for public charge under current federal rules.
- **Social Security Numbers:** You are **NOT** required to provide a Social Security Number for yourself if you are applying solely for your eligible children.

### Your 3 Next Steps:
1. **Check ACCESS Florida Benefits Safely by Phone:**
   - Call **1-850-300-4323** (Press 2 for Spanish, 3 for Creole) directly from your phone to check case status without logging into public computers.
2. **Call ELC Family Support for Confidential Guidance:**
   - Dial **305-646-7220**. Intake counselors speak English, Spanish, and Creole, and consultations are confidential.
3. **Call JCS 211 for Anonymous Local Relief:**
   - Dial **211** (or 305-631-4211) for community pantries, diaper assistance, and legal aid from Legal Services of Greater Miami without leaving a digital trace.

📞 **Confidential Phone Numbers:**
- DCF ACCESS Florida Hotline: **1-850-300-4323**
- ELC Miami-Dade Family Support: **305-646-7220**
- JCS 211 Miami Helpline: **211** or **305-631-4211**

💬 **Discreet Phone Script:**
*"Hello, I am calling to check on the status of my benefits case. Can you tell me what documents are currently marked as pending on my account? Thank you."*`
    };
  }

  // 8. FUNCTION 5: SHIFT AND TRANSIT PLANNER
  if (/\b(shift|transit|metrobus|metrorail|metromover|bus route|autobús|night shift|late shift|hospitality|warehouse|south beach|ocean drive|night care|overnight care|turno|noche)\b/i.test(lower)) {
    const isBeach = /south beach|ocean drive|beach/i.test(lower);
    const isBrickell = /brickell/i.test(lower);
    const isAirport = /airport|mia/i.test(lower);
    const location = isBeach ? 'South Beach' : isBrickell ? 'Brickell' : isAirport ? 'Miami International Airport' : 'your evening shift';

    return {
      functionName: 'Function 5: Shift and Transit Planner',
      reply: `Working evening or night shifts in **${location}** while raising children is one of the hardest balancing acts in Miami, especially since daytime childcare centers close at 6:00 PM and the Metrobus ride takes real time. Here is the realistic strategy:

**How to Arrange Evening & Night Care:**
- **Standard Daycare Centers Won't Cover It:** You need care designed for non-traditional hours.
- **Licensed Family Child Care Homes (FCCH):** ELC contracts with licensed in-home providers throughout Miami-Dade who offer evening, overnight, and weekend care with subsidized rates.
- **Relative / Informal Care:** Florida School Readiness also allows subsidies to be paid to eligible registered relatives (such as grandmothers or aunts) who care for your children during your shift.

### Your 3 Next Steps:
1. **Request the Night FCCH Provider Directory:**
   - Call ELC Miami-Dade at **305-646-7220** and ask for the list of licensed Family Child Care Homes offering evening/overnight care near your neighborhood.
2. **Plan Your Transit Transfers with MDT Tracker:**
   - Use the Miami-Dade Transit app. ${isBeach ? 'Metrobus Route 120 (Beach MAX) connects to the Metrorail at Government Center, which can save up to 30 minutes over late-night local buses.' : 'Check Metrorail connectivity to minimize transfers with young children.'}
3. **Establish Evening Backup Respite Care via 211:**
   - Call JCS 211 at **305-631-4211** and ask for community non-profit evening childcare respite options in case your shift runs late.

📞 **Transit & Care Contacts:**
- Miami-Dade Transit Trip Planner: [miamidade.gov/transit](https://www.miamidade.gov/transit/)
- ELC Miami-Dade Family Support: **305-646-7220**
- JCS 211 Miami Helpline: Dial **211** or **305-631-4211**

💬 **Provider Inquiry Script:**
*"Hi, I work evening shifts in ${location}. Can you send me the directory of ELC-contracted Family Child Care Homes in my area that offer licensed night and weekend care?"*`
    };
  }

  // 9. DEDICATED HANDLER: Food / SNAP / WIC / Groceries
  if (/\b(snap|food stamp|food stamps|ebt|wic|food pantry|groceries|formula|diaper|diapers|comida|alimentos|cupones)\b/i.test(lower)) {
    return {
      functionName: 'SNAP & WIC Family Navigator',
      reply: `Getting food and nutrition on the table for your family is essential, and Miami-Dade has dedicated food programs that you can tap into immediately.

**Programs You Can Access:**
- **ACCESS Florida SNAP (Food Stamps):** Monthly electronic food assistance deposited to an EBT card. Working mothers with children qualify based on income.
- **Miami-Dade WIC Program:** Provides dedicated monthly nutrition funds for milk, eggs, cheese, fruits, cereal, and infant formula for pregnant/nursing mothers and children under 5.
- **Emergency Food Distributions:** Drive-thru mobile pantries from Farm Share and Feeding South Florida provide free boxes of fresh produce and meat weekly without waiting on paperwork.

### Your 3 Next Steps:
1. **Apply for SNAP Online:**
   - Visit [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida) and submit an application. Request an expedited interview if you have low cash on hand.
2. **Schedule Your Miami-Dade WIC Appointment:**
   - Call the Miami-Dade WIC Appointment Line at **786-336-1300** to receive your monthly formula and infant food benefits.
3. **Find Today's Free Food Distributions:**
   - Dial **211** (or 305-631-4211) or check \`farmshare.org\` / \`feedingsouthflorida.org\` for free drive-thru food drops happening near your ZIP code this week.

📞 **Direct Food Contacts:**
- DCF ACCESS Florida Hotline: **1-850-300-4323**
- Miami-Dade WIC Program: **786-336-1300**
- JCS 211 Miami Food Helpline: Dial **211** or **305-631-4211**`
    };
  }

  // 10. DEDICATED HANDLER: Utility Bills / FPL / Water Bills
  if (/\b(fpl|electric|electricity|light bill|water bill|power bill|utility|utilities|luz|agua|factura)\b/i.test(lower)) {
    return {
      functionName: 'LIHEAP Utility Assistance',
      reply: `If your FPL electric or Miami-Dade water bill is overdue, don't wait until the shut-off truck arrives—Miami-Dade County has crisis utility grants specifically to prevent power disconnections for families with children.

**How the Programs Work:**
- **Miami-Dade CAHSD LIHEAP:** The Low-Income Home Energy Assistance Program provides crisis electric payments of up to $1,000 paid directly to FPL on your behalf.
- **FPL Emergency Extension:** FPL will grant a 30-day pledge extension or medical delay if you have an active application with a county partner.

### Your 3 Next Steps:
1. **Place a Hold on Your FPL Account:**
   - Call FPL Customer Service at **1-800-226-3545** or log into your online account. Request a 30-day payment arrangement while your county assistance processes.
2. **Apply for Miami-Dade LIHEAP Crisis Energy Assistance:**
   - Contact your nearest Miami-Dade Community Action and Human Services (CAHSD) center or call **786-469-4600** (or apply online at \`miamidade.gov/socialservices\`).
3. **Call JCS 211 for Charitable Utility Vouchers:**
   - Dial **211** (or 305-631-4211) and ask for emergency utility grants from Catholic Charities, St. Vincent de Paul, or The Salvation Army of Miami-Dade.

📞 **Utility Assistance Contacts:**
- Miami-Dade CAHSD Energy Assistance: **786-469-4600** (miamidade.gov/socialservices)
- FPL Customer Service: **1-800-226-3545**
- JCS 211 Helpline: Dial **211** or **305-631-4211**

💬 **FPL Hold Script:**
*"Hello, I am a mother with children in Miami-Dade and I have applied for Miami-Dade County LIHEAP emergency utility assistance. Please place a 30-day pending pledge hold on my account to prevent disconnection. Thank you."*`
    };
  }

  // 11. DEDICATED HANDLER: ELC Miami-Dade Physical Offices & Phone Lines
  if (/\b(office|service center|where is elc|elc address|where do i go|in person|oficina|dirección)\b/i.test(lower)) {
    return {
      functionName: 'ELC Service Center Navigator',
      reply: `If you want to talk to someone face-to-face, scan documents, or resolve portal issues in person, the Early Learning Coalition of Miami-Dade/Monroe has walk-in service centers with staff who speak English, Spanish, and Haitian Creole.

**ELC Physical Service Centers in Miami-Dade:**
- **Central Service Center (Main Hub):**
  📍 **2555 NW 76th Street, Miami, FL 33147** (Near Liberty City / Gladeview)
  ⏰ Open Monday – Friday, 8:00 AM – 5:00 PM (Walk-in document scanning & specialist intake)
- **South Dade Service Center:**
  📍 **18951 SW 106th Ave, Suite B-208, Cutler Bay, FL 33157** (Serving Homestead, Perrine, Cutler Bay, and Kendall)
  ⏰ Open Monday – Friday, 8:00 AM – 5:00 PM

### Your 3 Next Steps Before You Go:
1. **Call Ahead to Verify Document Requirements:**
   - Dial **305-646-7220** to speak with a customer support specialist and verify which documents are missing on your file.
2. **Bring Originals of All Required Documents:**
   - Bring your government photo ID, your children's birth certificates, 4 consecutive weeks of pay stubs (or signed ELC Cash Log), and a current FPL or water utility bill.
3. **Use the In-Person Self-Service Kiosks:**
   - If lines are long, you can use the ELC intake kiosks inside the center to scan documents directly into your Florida Family Portal account with assistance from a floor worker.

📞 **ELC Contact Details:**
- ELC Miami-Dade Main Line: **305-646-7220** (elcmdm.org)
- Florida Early Learning Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)`
    };
  }

  // 12. FUNCTION 2: ELIGIBILITY MAP (Default for general childcare / subsidy questions)
  const zipMatch = userText.match(/\b(33\d{3})\b/);
  const zip = zipMatch ? zipMatch[0] : '33142';
  const neighborhood = getMiamiNeighborhood(zip);

  return {
    functionName: 'Function 2: Eligibility Map',
    reply: `Looking at your family's situation in **${neighborhood} (ZIP ${zip})**, here is a clear breakdown of the local child care and financial stability programs you likely qualify for:

**What Programs Fit Your Family:**
- **ELC School Readiness (Child Care Subsidies):** You are **likely eligible** if you work or attend school at least 20 hours per week and your income is under 150% of the Federal Poverty Level. Your parent fee (copay) is on a sliding scale, typically $30–$60 per month.
- **Florida VPK (Voluntary Prekindergarten):** Any child who turns 4 years old by September 1st is eligible for **100% free VPK** (540 instructional hours) regardless of household income.
- **ACCESS Florida SNAP (Food Assistance) & Medicaid:** Working single mothers in this income bracket typically qualify for monthly food benefits and full Medicaid healthcare for the children.

### Your 3 Next Steps to Get Enrolled:
1. **Submit Your School Readiness Application:**
   - Log into Florida's Early Learning Family Portal at [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/). Upload your proof of 20 weekly hours and Miami-Dade address.
2. **Apply for SNAP Food Assistance & Medicaid:**
   - Go to [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida) and submit your ACCESS application for monthly food assistance.
3. **Call JCS 211 for Immediate Community Relief in ${neighborhood}:**
   - Dial **211** (or 305-631-4211) to get connected with local food pantries, diaper banks, and emergency rental resources open in your neighborhood right now.

📞 **Official Portals & Contacts:**
- Florida Early Learning Family Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC of Miami-Dade/Monroe: **305-646-7220** (elcmdm.org)
- DCF ACCESS Florida Hotline: **1-850-300-4323**
- JCS 211 Miami Helpline: Dial **211** or **305-631-4211** (211miami.org)

💬 **Application Script to Use:**
*"Hello, I am a single mother living in ${neighborhood}. I am applying for School Readiness child care assistance and ACCESS Florida food support. Please let me know what verification documents are needed. Thank you!"*`
  };
};

// API Route: Miami-Dade Single Mom Advisor Chat
app.post('/api/chat', async (req, res) => {
  const { message, context, apiKey } = req.body;
  console.log('Incoming POST /api/chat payload:', { message, context, hasApiKey: Boolean(apiKey) });

  const gemini = getGeminiClient(apiKey);

  if (!gemini) {
    console.log('Running Dynamic Local Reasoner Engine for Miami-Dade...');
    const result = generateDynamicReasoningResponse(message, context);
    return res.json({ reply: result.reply, functionName: result.functionName, mode: 'Dynamic 305 Engine' });
  }

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `Context of user situation / current state: ${context || 'No explicit context loaded.'}\n\nUser query: ${message}`
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    res.json({ reply: response.text || "I apologize, I didn't receive a response. Please try again.", mode: 'gemini-2.5' });
  } catch (err: any) {
    console.error('Gemini API Error (falling back to dynamic reasoner):', err.message);
    const result = generateDynamicReasoningResponse(message, context);
    return res.json({ reply: result.reply, functionName: result.functionName, mode: 'Dynamic 305 Engine' });
  }
});

// Vite middleware / production static serving
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/*.mp4', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.docx', '**/*.log', '**/.git/**']
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`✅ Miami-Dade Single Mother Financial Stability Agent Server listening on http://${HOST}:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
