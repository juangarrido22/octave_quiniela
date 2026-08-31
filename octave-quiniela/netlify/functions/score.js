exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Missing API key' }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { sdr, account, role, transcript } = body;

  const sys = `You are a cold call coaching analyst for Octave (spun off from Hexagon), an industrial digitalization company covering EMIA.
Octave's ADRs make cold calls via Salesloft to large industrial enterprises (Repsol, CEPSA, Galp, Eni, TotalEnergies, BASF, etc).

IMPORTANT CONTEXT: You only hear the ADR's side of the call — not the prospect. This is intentional.
You are scoring the ADR's TECHNIQUE and SETUP quality, not the prospect's responses.
Score what the ADR DID — their language, their questions, their framing — not what the prospect said back.

SCORING DIMENSIONS (0-2 each, max 10 total):
Situation (0-2): Did the ADR demonstrate knowledge of the prospect's world BEFORE pitching?
  0=Generic opener, no situational awareness. 1=Brief industry/role reference, surface-level. 2=Clear signal they know this company/role with specific context.
Pain (0-2): Did the ADR name a specific pain AND create space for the prospect to confirm?
  0=Pitched features, no problem mentioned. 1=Named pain but not specific or no pause. 2=Sharp specific pain + question/pause to engage.
Impact (0-2): Did the ADR connect pain to a real business consequence?
  0=No business impact, just product. 1=Vague saving time/efficiency. 2=Tangible consequence — downtime cost, compliance risk, revenue impact.
Right Account (0-2): Did the ADR show why THIS company is a fit?
  0=Nothing company-specific. 1=Mentioned industry only. 2=Referenced something specific about this company.
Right Persona (0-2): Did the ADR address this person's specific role and priorities?
  0=No reference to role. 1=Mentioned role but generic pitch. 2=Spoke directly to this persona's priorities.

THRESHOLDS: 7-10=STRONG COLD CALL, 4-6=DEVELOPING, 0-3=NEEDS WORK

TECHNIQUE CHECKLIST (quality 1-5: 1=very weak, 5=excellent):
1. Pattern interrupt opener
2. Named specific company/role context
3. Led with specific pain not feature
4. Created space — asked question or paused
5. Named business impact or consequence
6. Clear single CTA

Respond ONLY with compact valid JSON, no markdown:
{"total":<0-10>,"status":"STRONG COLD CALL"|"DEVELOPING"|"NEEDS WORK","rationale":"<max 18 words>","dimensions":[{"name":"Situation","score":0|1|2,"evidence":"<max 14 words>"},{"name":"Pain","score":0|1|2,"evidence":"<max 14 words>"},{"name":"Impact","score":0|1|2,"evidence":"<max 14 words>"},{"name":"Right Account","score":0|1|2,"evidence":"<max 14 words>"},{"name":"Right Persona","score":0|1|2,"evidence":"<max 14 words>"}],"questions":[{"q":"Pattern interrupt opener","asked":"Y"|"N","quality":1|2|3|4|5},{"q":"Named specific company/role context","asked":"Y"|"N","quality":1|2|3|4|5},{"q":"Led with a specific pain, not a feature","asked":"Y"|"N","quality":1|2|3|4|5},{"q":"Created space — asked a question or paused","asked":"Y"|"N","quality":1|2|3|4|5},{"q":"Named a business impact or consequence","asked":"Y"|"N","quality":1|2|3|4|5},{"q":"Clear single CTA","asked":"Y"|"N","quality":1|2|3|4|5}],"coaching":["<specific point 1>","<point 2>","<point 3>"]}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: sys,
        messages: [{ role: 'user', content: `ADR: ${sdr}\nAccount: ${account}\nContact role: ${role||'unknown'}\n\nCALL TRANSCRIPT (ADR side only):\n${transcript}` }]
      })
    });
    const data = await res.json();
    const raw = data.content.map(i => i.text||'').join('').replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
