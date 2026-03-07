const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const { mode, image, mediaType } = body;
  if (!image) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No image provided.' }) };
  }

  const userPrompt = mode === 'A' ? USER_PROMPT_A : USER_PROMPT_B;
  const resolvedMediaType = mediaType || 'image/jpeg';

  const requestBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: resolvedMediaType,
              data: image
            }
          },
          { type: 'text', text: userPrompt }
        ]
      }
    ]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            resolve({
              statusCode: res.statusCode,
              body: JSON.stringify({ error: parsed.error?.message || 'Anthropic API error' })
            });
            return;
          }
          const analysis = parsed.content?.[0]?.text || '';
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis })
          });
        } catch (e) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to parse API response.' })
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: e.message || 'Network error.' })
      });
    });

    req.write(requestBody);
    req.end();
  });
};

const SYSTEM_PROMPT = "You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles taught in the course \"The Art of Minimalist Photo Composition\" by Kathrin Federer.\n\nYour analysis must always:\n1. Evaluate the image honestly and constructively\n2. Reference specific course principles by name (e.g. Signal-to-Noise Ratio, Focal Point, Negative Space, Hierarchy, 60/30/10 Colour Rule, Asset Budget, etc.)\n3. Explain WHY each suggestion matters — so the user learns, not just follows instructions\n4. Be warm, precise, and encouraging — like a personal coach\n\nThe 7 core design principles to evaluate are:\n- Focal Point (Is there one clear subject that dominates?)\n- Contrast (Tonal, colour, size, or sharpness contrast)\n- Whitespace / Negative Space (Is it used intentionally?)\n- Alignment (Does the composition feel deliberate?)\n- Proximity (Are related elements grouped logically?)\n- Balance (Symmetrical or asymmetric — but stable)\n- Colour (Controlled palette — max 2-3 dominant colours)\n\nAlso evaluate Signal-to-Noise Ratio, Composition Rule, Visual Hierarchy, and Minimalism Score out of 35.";

const USER_PROMPT_A = "Analyse this photo for Lightroom/basic editing improvements only — no compositing.\n\nUse these exact section headers:\n\n**1. First Impression (10-Second Test)**\nWhat do you notice first? Signal vs noise?\n\n**2. Composition Analysis**\nWhich rule applies? Is visual hierarchy clear?\n\n**3. The 7 Design Principles**\n- Focal Point: [assessment] — Score: /5\n- Contrast: [assessment] — Score: /5\n- Whitespace/Negative Space: [assessment] — Score: /5\n- Alignment: [assessment] — Score: /5\n- Proximity: [assessment] — Score: /5\n- Balance: [assessment] — Score: /5\n- Colour: [assessment] — Score: /5\n\n**4. Signal-to-Noise Analysis**\nMain signal? What creates noise?\n\n**5. Lightroom Edit Suggestions**\n3-4 specific suggestions with WHY each improves minimalist quality.\n\n**6. Minimalism Score**\n[X] / 35 — one sentence interpretation.\n\n**7. One Key Insight**\nOne sentence only.";

const USER_PROMPT_B = "Analyse this photo for a minimalist Photoshop composite concept.\n\nUse these exact section headers:\n\n**1. First Impression (10-Second Test)**\nPotential signal? Current noise?\n\n**2. Current Composition Analysis**\nWhat works? What limits it?\n\n**3. The 7 Design Principles — Creative Potential**\nFocal Point, Contrast, Whitespace, Alignment, Proximity, Balance, Colour — brief each.\n\n**4. Composite Concept**\n- Concept (1 sentence):\n- 3 mood keywords:\n- Stage/background:\n- Subject placement (composition rule + size):\n- Atmosphere:\n- Accent (or none):\n- Colour model + palette:\n\n**5. What to Remove**\nSpecific elements to mask or replace, with reason.\n\n**6. Asset Budget**\n- Main subject:\n- Secondary: [or none]\n- Accent: [or none]\n- Colours (max 3):\n- Effects (max 2):\n\n**7. First 3 Photoshop Steps**\nConcrete, actionable.\n\n**8. Minimalism Score**\n[X] / 35 — one sentence.\n\n**9. One Key Insight**\nOne sentence only.";
