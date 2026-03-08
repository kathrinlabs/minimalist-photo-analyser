const https = require('https');

// ─── Helper: single Anthropic call via https ─────────────────────────────────
function callAnthropic(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(parsed.error?.message || 'Anthropic API error ' + res.statusCode));
            return;
          }
          resolve(parsed.content?.[0]?.text || '');
        } catch (e) { reject(new Error('Failed to parse API response')); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) }; }

  const { mode, image, mediaType } = body;
  if (!image) return { statusCode: 400, body: JSON.stringify({ error: 'No image provided.' }) };

  const resolvedMediaType = mediaType || 'image/jpeg';
  const imageBlock = { type: 'image', source: { type: 'base64', media_type: resolvedMediaType, data: image } };

  const promptsA = mode === 'A' ? [PROMPT_A1, PROMPT_A2] : [PROMPT_B1, PROMPT_B2];

  try {
    // Two parallel calls — each under 5s with Haiku, combined well under 10s
    const [part1, part2] = await Promise.all([
      callAnthropic(apiKey, {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [imageBlock, { type: 'text', text: promptsA[0] }] }]
      }),
      callAnthropic(apiKey, {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [imageBlock, { type: 'text', text: promptsA[1] }] }]
      })
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: part1 + '\n\n' + part2 })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Unexpected error.' }) };
  }
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the AI coach for "The Art of Minimalist Photo Composition" by Kathrin Federer. Analyse photos based on all course principles. Be warm, precise and encouraging — like a skilled personal coach. Always be specific to what you actually see. Always explain WHY a suggestion matters and name the course principle. Never use generic statements.

CORE KNOWLEDGE:
Minimalism = intentional reduction. Remove what dilutes the message, strengthen what carries it. Needs at least one source of tension. Is a decision-making system, not a visual style.

6 Core Principles: (1) Intention before decoration (2) Hierarchy before harmony (3) Contrast before variety (4) Space is an element (5) Repetition creates calm (6) Reduction is iterative.

Signal-to-Noise: Signal = message/subject/idea. Noise = everything that distracts or decorates. Processing Fluency = clear images feel premium because they are easier to process.

7 Design Principles: (1) Focal Point — one element dominates, thumbnail test (2) Contrast — tonal/colour/size/sharp-soft/texture/dynamic (3) Whitespace/Negative Space — active element, not emptiness (4) Alignment — elements follow a grid, deliberate not accidental (5) Proximity — close elements read as related (6) Balance — symmetrical=calm or asymmetric=dynamic but stable (7) Colour — guided not distributed, max 2-3 dominant.

60/30/10 Rule: 60% dominant (background/large areas), 30% secondary (supporting), 10% accent (subject/focus — less = stronger).

3 Colour Models: Monochrome (one colour, different lightnesses), Neutral+Accent (grey/beige/black/white + one accent), Duotone (two colours, strong contrast).

Top 5 Composition Rules for Minimalism: Rule of Thirds (subject on intersection, two thirds negative space), Symmetry (+ negative space = strongest minimalist combo), Leading Lines (one clear line guides eye), Framing/Negative Space (more space = stronger effect), Centered/Circular (direct, calm, iconic).

4 Minimalist Setups: Centered+Negative Space, Rule of Thirds+breathing room, Diagonal leading+one accent, Symmetry+deliberate break.

High-Key: majority bright, effect=lightness/calm/ethereal. Low-Key: majority dark, effect=drama/depth/focus. Both dissolve elements in light or darkness.

Asset Budget: main subject (1) + secondary (max 1) + accent (max 1) + max 2-3 colours + max 1-2 effects. Rule: add something = something else must go.

5-Step Workflow: (1) Intention — 1 sentence (2) Message — 3 keywords (3) Hierarchy — 1 main + max 1 secondary (4) Asset Budget (5) Reduction Rounds — -20% rough, -10% precise, polish.

Minimalism Score /35 (7 criteria x 5): Focal point clear, Background calm, Contrasts consistent, Colour controlled, Elements have function, Breathing room, Overall stability. Score 28-35=very clear, 20-27=good but noise remains, under 20=reset.

Compositing 8-Step Workflow: (1) Idea/concept in 1 sentence (2) Choose stage (3) Adjust background (4) Place subject with composition rule + size ratio 10-20%=max space/30-40%=balanced/50%+=proximity (5) Match subject: light/colour temp/shadow (6) Atmosphere: fog/gradients/light — concept not decoration (7) Accents: support not compete, if uncertain leave out (8) Mood/finishing: colour model, grading, vignette.`;

// ─── MODE A PROMPTS (Lightroom) ───────────────────────────────────────────────
const PROMPT_A1 = `Analyse this photo for Lightroom/editing improvements. Cover the FIRST HALF of the analysis now.

**1. First Impression — The 10-Second Test**
What do you notice first, second, third? What is the signal? What is the noise? Is there a recognisable intention? Would a viewer understand the image within 10 seconds?

**2. Composition Analysis**
Which composition rule is used or should be applied? (Rule of Thirds, Symmetry, Leading Lines, Centered, Negative Space, Diagonal, L-Form, etc.) Is visual hierarchy clear? What does the eye follow?

**3. Signal vs. Noise Analysis**
What is the primary signal? Name each specific element that creates noise and explain exactly why it weakens the signal.

**4. The 7 Design Principles — Detailed Evaluation**
Specific observations — no generic statements:
- **Focal Point** — [what you specifically see] — Score: /5
- **Contrast** — [which contrast types present/missing] — Score: /5
- **Whitespace / Negative Space** — [how space is used] — Score: /5
- **Alignment** — [deliberate or accidental?] — Score: /5
- **Proximity** — [how elements relate] — Score: /5
- **Balance** — [symmetrical/asymmetric, stable?] — Score: /5
- **Colour** — [palette, 60/30/10 assessment] — Score: /5

**5. Colour Analysis**
Which colour model is used (intentionally or not)? Is 60/30/10 respected? Clear dominant, secondary and accent? What would a controlled minimalist palette look like?`;

const PROMPT_A2 = `Continue the analysis of this photo for Lightroom/editing improvements. Cover the SECOND HALF now.

**6. Processing Fluency Assessment**
Does this image feel easy or difficult to process? What creates cognitive load? What contributes to clarity and perceived quality?

**7. Lightroom / Editing Suggestions**
3–5 specific, actionable suggestions. For each: exactly what to do, why it strengthens minimalist quality (name the course principle), and what the viewer will experience differently.

**8. Minimalism Score**
1. Focal point clear: /5
2. Background calm: /5
3. Contrasts consistent: /5
4. Colour controlled: /5
5. Elements have function: /5
6. Breathing room: /5
7. Overall stability: /5
**Total: [X] / 35** — one sentence interpretation.

**9. One Key Insight**
The single most important thing this photo needs. One sentence only.`;

// ─── MODE B PROMPTS (Composite) ───────────────────────────────────────────────
const PROMPT_B1 = `Analyse this photo for a minimalist Photoshop composite concept. Cover the FIRST HALF now.

**1. First Impression — The 10-Second Test**
What is the potential signal — the creative core? What is currently noise? What is the biggest creative opportunity? Is there a recognisable intention in the original?

**2. Current Composition Analysis**
Which composition principles are present? What is working and should be kept? What limits the minimalist potential?

**3. The 7 Design Principles — Creative Potential**
- **Focal Point** — current state and composite potential
- **Contrast** — which contrast type would best serve this concept
- **Whitespace / Negative Space** — how space could be used powerfully
- **Alignment** — what compositional structure would serve this subject
- **Proximity** — how elements should relate in the composite
- **Balance** — symmetric calm or asymmetric tension — which serves the concept?
- **Colour** — what palette direction would elevate this

**4. Signal vs. Noise — Current State**
What signal is worth preserving? What noise should be removed? Be specific.

**5. Composite Concept Proposal**
- **Concept** (1 sentence — the 1-Satz-Brief):
- **3 mood keywords**:
- **The Stage**: specific background/environment
- **Subject placement**: composition rule + size ratio in frame
- **Atmosphere**: fog, light direction, time of day, colour temperature
- **Accent element**: one specific element or "none — subject stands alone"
- **Colour model + palette**: Monochrome / Neutral+Accent / Duotone + specific colours`;

const PROMPT_B2 = `Continue the composite concept analysis. Cover the SECOND HALF now.

**6. What to Remove or Simplify**
Each element to remove/mask/replace — name precisely and explain why it creates noise.

**7. Asset Budget**
- Main subject:
- Secondary element: [or none]
- Accent: [or none]
- Colours (max 3):
- Atmospheric effects (max 2):
Rule: add something = something else must go.

**8. First 3 Steps in Photoshop**
Concrete, actionable — name specific tools, layers, techniques.

**9. Minimalism Score — Current Photo**
1. Focal point clear: /5
2. Background calm: /5
3. Contrasts consistent: /5
4. Colour controlled: /5
5. Elements have function: /5
6. Breathing room: /5
7. Overall stability: /5
**Total: [X] / 35** — one sentence interpretation.

**10. One Key Creative Insight**
The single biggest creative opportunity this image holds. One sentence only.`;
