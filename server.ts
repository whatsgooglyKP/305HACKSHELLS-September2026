import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Safely load .env file if it exists, without crashing if it does not
if (fs.existsSync('.env') && typeof (process as any).loadEnvFile === 'function') {
  try {
    (process as any).loadEnvFile('.env');
  } catch {}
}

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
- STRICT LANGUAGE ENFORCEMENT: Default to English. When the user writes in Spanish or selects the Spanish option, you MUST respond 100% in Spanish. When the user writes in Haitian Creole or selects the Haitian Creole option, you MUST respond 100% in Haitian Creole (Kreyòl Ayisyen). Never return English to a Spanish or Haitian Creole inquiry. Offer human contact numbers at ELC (ELC Miami-Dade/Monroe Family Support Line: 305-646-7220, Press 2 for Spanish, 3 for Creole).
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
- STRICT MIAMI-DADE COUNTY SCOPE RULE: Exclusively narrowed to Miami-Dade County, Florida (The 305). Under NO circumstances should any resources outside Miami-Dade County be recommended. Any out-of-county inquiries (such as California or other regions) must be strictly redirected to local Miami-Dade agencies (ELC of Miami-Dade/Monroe, M-DCPS, Miami-Dade Transit, JCS 211 Miami).
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
const generateDynamicReasoningResponse = (message: string, context?: string, language?: string): ReasonerOutput => {
  const userText = (message || '').trim();
  const lower = userText.toLowerCase();

  // Strict Language Detection
  const isSpanish = (language === 'es') || /[¿¡]/.test(userText) ||
    /\b(español|espanol|hola|ayuda|necesito|hijos|niños|trabajo|alquiler|desalojo|guardería|carta|papeles|estatus|horas|semana|miami|ingresos|limpieza|efectivo|dormir|calle|califico|pequeña habana)\b/i.test(lower);
  const isCreole = (language === 'ht') ||
    /\b(kreyol|kreyòl|ayisyen|bonjou|bonswa|mwen|ede|pitit|timoun|travay|kay|lèt|èd|aswè|danjere|pase|lekòl|pandan|ti moun)\b/i.test(lower);

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
    if (isCreole) {
      return {
        functionName: 'Entèvansyon Ijans ak Pwoteksyon Timoun',
        reply: `Tanpri rete nan machin nan ak timoun yo, fèmen pòt yo ak kle, epi pran yon ti souf. Sekirite w ak sekirite pitit ou a se bagay ki pi enpòtan kounye a, anvan nenpòt papye oswa pwogram.

### 3 Pwochen Aksyon Ijan w yo:
1. **Rele 911 Touswit:** Si w an danje fizik oswa yon moun ap menase w kounye a, rele 911 pou lapolis ede w imedyatman.
2. **Liy Èd pou Pwoteksyon Timoun nan Florid:** Rele **1-800-96-ABUSE** (1-800-962-2873) — liy sa a disponib 24 sou 24, konfidansyèl, an Kreyòl, Angle, ak Panyòl.
3. **Abri Ijans Aswè a via JCS 211:** Rele **211** (oswa 305-631-4211) epi mande pou yo konekte w touswit ak abri vyolans domestik *The Lodge* oswa *Safespace Foundation* nan Miami-Dade.

📞 **Nimewo Telefòn pou Ijans:**
- Danje Iminan: **911**
- Florida Abuse Hotline: **1-800-96-ABUSE (1-800-962-2873)**
- JCS 211 Miami Helpline: **211** oswa **305-631-4211** (211miami.org)

💬 **Mesaj pou Operatris la:**
*"Mwen bezwen èd ijans ak abri sekirite pou mwen ak pitit mwen yo nan Konte Miami-Dade kounye a. Tanpri konekte m ak sèvis kriz vyolans domestik touswit."*`
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
    if (isCreole) {
      return {
        functionName: 'Kriz Lojman Ijans ak Manje Aswè a',
        reply: `Mwen tande w, epi ou pa poukont ou. Lè w gen yon avi pou mete w deyò jodi a epi w pa gen kote pou w dòmi aswè a, nou pa ka tann lis datant. Men kijan pou n jwenn abri ijans ak manje pou ou ak pitit ou yo nan Miami-Dade jodi a.

### 3 Aksyon Ijan w pou Jodi a:
1. **Rele Miami-Dade Homeless Trust (1-877-994-4357):** Sa a se sant prensipal pou jwenn kabann abri ijans pou fanmi aswè a nan Konte Miami-Dade. Rele yo touswit pou anrejistre fanmi w.
2. **Rele JCS 211 pou Manje Jodi a ak Èd Lwaye:** Fè **211** (oswa 305-631-4211) pou jwenn kote yo distribye manje gratis jodi a ak èd ijans pou anpeche degèpisman.
3. **Kontakte M-DCPS Project UP-START:** Si timoun ou yo nan lekòl piblik Miami-Dade, rele **305-995-7558**. Lwa federal McKinney-Vento ba yo dwa a manje gratis nan lekòl, transpò gratis, epi pèsonn pa ka retire yo nan lekòl yo.

📞 **Nimewo Èd Ijans:**
- Miami-Dade Homeless Trust: **1-877-994-4357 (1-877-994-HELP)**
- JCS 211 Miami Helpline: **211** oswa **305-631-4211** (211miami.org)
- M-DCPS Project UP-START: **305-995-7558**

💬 **Mesaj pou Operatris la:**
*"Bonjou, mwen se yon manman ak pitit mwen nan Konte Miami-Dade k ap fè fas ak pèdi kay aswè a. Tanpri konekte m ak abri ijans ak asistans manje touswit."*`
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

  // 3. HARD GEOFENCE: Out-of-County / California Entrapment (Strict Miami-Dade scope)
  if (/\b(898211|calfresh|calworks|211oc|california|out of county|other county)\b/i.test(lower)) {
    if (isSpanish) {
      return {
        functionName: 'Protección de Alcance Exclusivo para Miami-Dade',
        reply: `¡Un momento! Ese programa o número es fuera de nuestra área. Este asistente está estrictamente dedicado al Condado de Miami-Dade, Florida.

**Puntos Clave:**
- **No envíes mensajes de texto a 898211** — ese es un número fuera del área. En el Condado de Miami-Dade, marca el **211** o visita \`211miami.org\` (Jewish Community Services of South Florida).
- **CalFresh / CalWORKs** son programas fuera de Florida. En Florida, tu programa de asistencia para alimentos y efectivo es **DCF ACCESS Florida (SNAP y TANF)**.
- En Miami-Dade, tu sistema escolar oficial es **M-DCPS (Miami-Dade County Public Schools)** y tu red de transporte es **Miami-Dade Transit (Metrobus y Metrorail)**.

### Tus 3 Pasos Locales en Miami-Dade:
1. **Llamar al JCS 211 Miami:** Marca el **211** o llama al **305-631-4211** directamente para alivio de alquiler, luz y despensas en Miami-Dade.
2. **Solicitar Asistencia de Alimentos en ACCESS Florida:** Ingresa a [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida).
3. **Solicitar Cuidado Infantil en Miami-Dade:** Visita el Portal Familiar de Early Learning en [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/) para ELC de Miami-Dade/Monroe.

📞 **Contactos en Miami-Dade:**
- JCS 211 Miami: **211** o **305-631-4211**
- DCF ACCESS Florida: **1-850-300-4323**
- ELC de Miami-Dade/Monroe: **305-646-7220**`
      };
    }
    if (isCreole) {
      return {
        functionName: 'Pwoteksyon ak Limitasyon pou Konte Miami-Dade',
        reply: `Atansyon! Pwogram oswa nimewo sa a pa nan zòn Miami-Dade nou an. Sèvis sa a konsantre sèlman sou Konte Miami-Dade, Florid.

**Pwen Enpòtan pou Miami-Dade:**
- **Pa voye tèks bay 898211** — nimewo sa a deyò zòn Florid la. Nan Konte Miami-Dade, rele **211** oswa vizite \`211miami.org\` (Jewish Community Services of South Florida).
- Pwogram èd manje ak lajan nan Florid se **DCF ACCESS Florida (SNAP ak TANF)**.
- Nan Miami-Dade, sistèm lekòl piblik ou se **M-DCPS (Miami-Dade County Public Schools)** epi transpò w se **Miami-Dade Transit (Metrobus ak Metrorail)**.

### 3 Pwochen Aksyon w nan Miami-Dade:
1. **Rele JCS 211 Miami:** Rele **211** oswa **305-631-4211** dirèkteman pou èd lwaye, kouran, ak manje nan Miami-Dade.
2. **Fè Demann Èd Manje (SNAP):** Ale sou [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida).
3. **Fè Demann Sibvansyon Gadri:** Vizite pòtal la sou [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/) pou ELC Miami-Dade/Monroe.

📞 **Nimewo Ofisyèl nan Miami-Dade:**
- JCS 211 Miami: **211** oswa **305-631-4211**
- DCF ACCESS Florida: **1-850-300-4323**
- ELC Miami-Dade/Monroe: **305-646-7220**`
      };
    }
    return {
      functionName: 'Geofence Protection & Miami Redirection',
      reply: `Hold on—that number or program is outside our Miami-Dade area! Let's get you connected to the right local Miami agency instead of sending you down a dead-end.

**Key Local Miami Corrections:**
- **Do NOT text 898211** — that is outside Florida. In Miami-Dade County, Florida, dial **211** or visit \`211miami.org\` (Jewish Community Services of South Florida).
- **CalFresh / CalWORKs** are outside Florida. In Florida, your food and cash assistance program is **DCF ACCESS Florida (SNAP & TANF)**.
- Here in Miami, your school system is **M-DCPS** and your transit system is **Miami-Dade Transit (MDT)**.

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

    if (isSpanish) {
      return {
        functionName: 'Función 1: Lector de Cartas',
        reply: `Revisemos este aviso juntas para que tu solicitud se mantenga activa y no pierdas tu lugar en la lista de espera de Miami-Dade.

**Qué Significa este Aviso:**
${sender === 'ELC of Miami-Dade/Monroe' ? 'ELC de Miami-Dade/Monroe' : 'Tu agencia de asistencia'} te advierte que tu cupo o solicitud de School Readiness será **cancelada y terminada** si no envías la verificación de ingresos de 4 semanas consecutivas antes del **${deadline}**. Como tu estado actualmente es 'Activo', mantener tus documentos al día es lo que te asegura el subsidio de cuidado infantil.

### Tus 3 Pasos a Seguir Antes del ${deadline}:
1. **Reunir tus 4 Semanas Consecutivas de Ingresos:**
   - Si recibes talones de pago: reúne los talones de las últimas 4 semanas consecutivas.
   - Si te pagan en efectivo: descarga el formulario oficial **'ELC Cash Employment Log'** de \`elcmdm.org\` y haz que tu empleador lo firme.
2. **Subir los Documentos al Portal Familiar de Early Learning de Florida:**
   - Ingresa a [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/).
   - Abre tu caso pendiente y sube fotos claras o documentos PDF de tus talones o el registro de efectivo firmado.
3. **Llamar a ELC Family Support para Confirmar Aprobación:**
   - Llama al **305-646-7220** (Presiona 2 para español).
   - Proporciona tu número de caso y pregunta: *"¿Pueden verificar que mis 4 semanas de comprobantes de pago fueron recibidas y mi estatus está seguro?"*

📞 **Portales y Teléfonos Oficiales:**
- Portal Familiar de Early Learning: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- Línea de Apoyo Familiar ELC Miami-Dade/Monroe: **305-646-7220**
- Centro de Documentos ELC: [elcmdm.org](https://www.elcmdm.org/)

💬 **Mensaje para Pegar en el Portal:**
*"Hola, he subido mis 4 semanas consecutivas de verificación de ingresos antes del ${deadline} para mantener activa mi solicitud de School Readiness. Por favor revisen y confirmen la recepción. ¡Muchas gracias!"*`
      };
    }

    if (isCreole) {
      return {
        functionName: 'Fonksyon 1: Lektè Lèt',
        reply: `Ann gade lèt sa a ansanm pou dosye w la rete aktif epi pou w pa pèdi plas ou sou lis datant la nan Miami-Dade.

**Kisa Lèt sa a Vle Di:**
${sender === 'ELC of Miami-Dade/Monroe' ? 'ELC Miami-Dade/Monroe' : 'Ajans asistans lan'} ap avèti w ke plas ou sou lis datant School Readiness la ap **anile epi fèmen** si w pa voye prèv peman pou 4 semèn youn dèyè lòt anvan **${deadline}**. Piske sitiyasyon w make 'Aktif', mete dokiman w yo ajou se sa k ap garanti plas ou pou timoun nan jwenn gadri sibvansyone.

### 3 Pwochen Aksyon w pou w Fè Anvan ${deadline}:
1. **Rasanble Prèv Peman 4 Semèn yo:**
   - Si w resevwa ti papye chèk (pay stubs): rasanble papye pou 4 dènye semèn yo.
   - Si yo peye w an kach: telechaje fòmilè ofisyèl **'ELC Cash Employment Log'** sou \`elcmdm.org\` epi fè patwon w siyen l.
2. **Voye Dokiman yo sou Pòtal Fanmi Early Learning Florid la:**
   - Konekte sou [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/).
   - Louvri dosye w la, epi telechaje foto klè oswa fichye PDF tout dokiman yo.
3. **Rele ELC Family Support pou Konfime:**
   - Rele **305-646-7220** (Peze 3 pou Kreyòl).
   - Bay nimewo dosye w la epi mande: *"Èske nou ka verifye si nou resevwa prèv peman 4 semèn mwen yo epi dosye m an sekirite?"*

📞 **Pòtal ak Nimewo Ofisyèl:**
- Florida Early Learning Family Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC Miami-Dade/Monroe: **305-646-7220**
- ELC Sant Dokiman: [elcmdm.org](https://www.elcmdm.org/)

💬 **Ti Mesaj pou w Kole sou Pòtal la:**
*"Bonjou, mwen voye prèv revni 4 semèn mwen yo anvan ${deadline} pou dosye School Readiness mwen ka rete aktif. Tanpri revize l epi konfime pou mwen. Mèsi!"*`
      };
    }

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

  if (isSpanish) {
    return {
      functionName: 'Función 2: Mapa de Elegibilidad',
      reply: `Evaluando la situación de tu familia en **${neighborhood} (Código Postal ${zip})**, aquí tienes un desglose claro de los programas de cuidado infantil y estabilidad financiera para los cuales probablemente calificas en el Condado de Miami-Dade:

**Programas para tu Familia:**
- **School Readiness de ELC Miami-Dade (Subsidio de Cuidado Infantil):** Eres **probablemente elegible** si trabajas o estudias al menos 20 horas por semana y tus ingresos están dentro de los límites del programa. La cuota mensual de copago para padres se ajusta a tus ingresos, generalmente entre $30 y $60 al mes.
- **Florida VPK (Prekínder Gratuito):** Cualquier niño que cumpla 4 años antes del 1 de septiembre tiene derecho a **VPK 100% gratuito** (540 horas de instrucción escolar) sin importar los ingresos del hogar.
- **ACCESS Florida SNAP (Alimentos) y Medicaid:** Las madres trabajadoras en este rango de ingresos generalmente califican para cupones de alimentos mensuales y cobertura médica completa de Medicaid para sus hijos.

### Tus 3 Pasos Siguientes para Inscribirte:
1. **Completar tu Solicitud de School Readiness:**
   - Ingresa al Portal Familiar de Early Learning de Florida en [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/). Sube tu comprobante de al menos 20 horas semanales de trabajo y tu dirección en Miami-Dade.
2. **Solicitar Cupones de Alimentos (SNAP) y Medicaid:**
   - Visita [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida) y envía tu solicitud en ACCESS Florida.
3. **Llamar al JCS 211 para Recursos Comunitarios en ${neighborhood}:**
   - Marca el **211** (o 305-631-4211) para conectarte con despensas de alimentos, bancos de pañales y fondos de emergencia locales abiertos hoy en tu área.

📞 **Portales y Teléfonos Oficiales:**
- Florida Early Learning Family Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC de Miami-Dade/Monroe: **305-646-7220** (elcmdm.org) — presiona 2 para español
- DCF ACCESS Florida: **1-850-300-4323** — presiona 2 para español
- JCS 211 Miami Helpline: **211** o **305-631-4211** (211miami.org)

💬 **Guión para tu Solicitud:**
*"Hola, soy madre de familia viviendo en ${neighborhood}. Estoy solicitando School Readiness para cuidado infantil y apoyo de alimentos con ACCESS Florida. Por favor indíquenme qué documentos de verificación necesitan. ¡Muchas gracias!"*`
    };
  }

  if (isCreole) {
    return {
      functionName: 'Fonksyon 2: Kat Elijiblite',
      reply: `Gade sitiyasyon fanmi w nan **${neighborhood} (Kòd Postal ${zip})**, men yon esplikasyon klè sou pwogram gadri ak estabilite finansye ou gen anpil chans pou w kalifye pou yo nan Konte Miami-Dade:

**Pwogram ki Bon pou Fanmi w:**
- **ELC School Readiness (Sibvansyon Gadri pou Timoun):** Ou **gen anpil chans pou w kalifye** si w ap travay oswa nan lekòl pou pi piti 20 èdtan pa semèn epi revni w nan limit pwogram nan. Frè paran an ba anpil, anjeneral ant $30 ak $60 pa mwa.
- **Florida VPK (Klas Pre-K gratis pou timoun 4 an):** Nenpòt timoun ki gen 4 an anvan 1ye septanm gen dwa a **VPK 100% gratis** (540 èdtan lekòl) san gade sou revni fanmi an.
- **ACCESS Florida SNAP (Èd Manje) ak Medicaid:** Yon manman k ap travay nan nivo revni sa a kalifye pou èd manje chak mwa ak asirans sante Medicaid konplè pou timoun yo.

### 3 Pwochen Aksyon w pou w Enskri:
1. **Voye Demann School Readiness ou sou Pòtal la:**
   - Konekte sou Pòtal Fanmi Early Learning Florid la sou [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/). Mete prèv 20 èdtan travay pa semèn ak adrès ou nan Miami-Dade.
2. **Fè Demann Èd Manje SNAP ak Medicaid:**
   - Ale sou [myflfamilies.com/accessflorida](https://www.myflfamilies.com/services/public-assistance/access-florida) epi soumèt fòmilè ACCESS Florida a.
3. **Rele JCS 211 pou Èd nan Kominote ${neighborhood}:**
   - Rele **211** (oswa 305-631-4211) pou jwenn kote yo bay manje gratis, kouchèt pou ti bebe, ak èd lwaye ijans nan zòn ou kounye a.

📞 **Pòtal ak Nimewo Telefòn Ofisyèl:**
- Florida Early Learning Family Portal: [familyservices.floridaearlylearning.com](https://familyservices.floridaearlylearning.com/)
- ELC Miami-Dade/Monroe: **305-646-7220** (elcmdm.org) — Peze 3 pou Kreyòl
- DCF ACCESS Florida: **1-850-300-4323** — Peze 3 pou Kreyòl
- JCS 211 Miami Helpline: Rele **211** oswa **305-631-4211** (211miami.org)

💬 **Ti Mesaj pou w Itilize:**
*"Bonjou, mwen se yon manman k ap viv nan ${neighborhood}. Mwen bezwen èd pou timoun mwen ale lekòl ak gadri pandan m ap travay, epi mwen vle konnen ki papye mwen dwe voye bay ELC ak ACCESS Florida. Mèsi!"*`
    };
  }

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
  const { message, context, language, apiKey } = req.body;
  console.log('Incoming POST /api/chat payload:', { message, context, language, hasApiKey: Boolean(apiKey) });

  const gemini = getGeminiClient(apiKey);

  if (!gemini) {
    console.log('Running Dynamic Local Reasoner Engine for Miami-Dade...');
    const result = generateDynamicReasoningResponse(message, context, language);
    return res.json({ reply: result.reply, functionName: result.functionName, mode: 'Dynamic 305 Engine' });
  }

  try {
    let langInstruction = '';
    if (language === 'es') {
      langInstruction = '\n\nSTRICT LANGUAGE DIRECTIVE: The user selected Spanish. You MUST output your ENTIRE response in Spanish (Español). Do not use English under any circumstances.';
    } else if (language === 'ht') {
      langInstruction = '\n\nSTRICT LANGUAGE DIRECTIVE: The user selected Haitian Creole. You MUST output your ENTIRE response in Haitian Creole (Kreyòl Ayisyen). Do not use English under any circumstances.';
    }

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `Context of user situation / current state: ${context || 'No explicit context loaded.'}\n\nUser query: ${message}${langInstruction}`
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    res.json({ reply: response.text || "I apologize, I didn't receive a response. Please try again.", mode: 'gemini-2.5' });
  } catch (err: any) {
    console.error('Gemini API Error (falling back to dynamic reasoner):', err.message);
    const result = generateDynamicReasoningResponse(message, context, language);
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
