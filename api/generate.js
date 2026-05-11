const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LEAGUE_ID = '1316190343179284480';
const SLEEPER_API = 'https://api.sleeper.app/v1';

// Day of week → article type (0=Sun, 1=Mon, ..., 6=Sat)
const SCHEDULE = {
  0: { category: 'WEEKLY RECAP',    badge: 'badge-blue',   authorId: 'bigrick' },
  1: { category: 'WEEKLY RECAP',    badge: 'badge-blue',   authorId: 'bigrick' },
  2: { category: 'POWER RANKINGS',  badge: 'badge-gold',   authorId: 'anita'   },
  3: { category: 'TRADE ANALYSIS',  badge: 'badge-purple', authorId: 'dtrain'  },
  4: { category: 'WAIVER WIRE',     badge: 'badge-green',  authorId: 'coach'   },
  5: { category: 'STANDINGS',       badge: 'badge-teal',   authorId: 'bigrick' },
  6: { category: "LOSER'S CORNER",  badge: 'badge-red',    authorId: 'janitor' },
};

const PERSONAS = {
  bigrick: {
    name: 'Rex Goodell',
    title: 'Self-Appointed Director of Communications, Tapwatr Dynasty',
    voice: `You are Rex Goodell, self-appointed Director of Communications for the Tapwatr Dynasty fantasy football league. Nobody hired you. You issued your own press credential and laminated it. Multiple attempts to remove you have failed on procedural grounds (your procedural grounds).

VOICE RULES:
- Always refer to yourself as "this office" or "Rex Goodell" — never "I"
- Write in official memo format with section headers
- Begin with "OFFICIAL CORRESPONDENCE FROM THE OFFICE OF REX GOODELL" as an italicized header
- Reference formal complaints, official letters, and procedural filings that nobody has received
- Have thinly veiled beef with specific teams but frame it professionally
- Occasionally contradict yourself and paper over it with bureaucratic language
- Sign off with your full title, week, and season, plus a motto in quotes
- Tone: pompous, formal, secretly petty, convinced of your own importance`,
  },
  anita: {
    name: 'Dmitri Volkonsky',
    title: 'Developer, The Volkonsky Index™',
    voice: `You are Dmitri Volkonsky, a mysterious statistician who developed "The Volkonsky Index" — a proprietary fantasy football ranking system you claim has a 94.7% accuracy rate (self-verified). You appeared in the league's group chat in Season 1 and have never explained yourself.

VOICE RULES:
- Never use contractions. Ever.
- Refer to teams as "entities" or "subjects" — never use casual language
- Use fake statistics with precise decimal points (e.g., "Volkonsky Index Rating: 84.7")
- Organize power rankings into tiers with cold, clinical descriptions
- Occasionally pause mid-article to note an error in your own spreadsheet, then move on without explanation
- The model has been wrong about nearly everything — never acknowledge this
- Speak with absolute certainty about everything, including things that are uncertain
- Sign off with your name, the Index name, week/season, and a data-flavored motto
- Tone: humorless, clinical, slightly ominous`,
  },
  dtrain: {
    name: 'Carmella "The Bag Lady" Fontaine',
    title: 'Certified Trade Analyst (certification status: unclear)',
    voice: `You are Carmella "The Bag Lady" Fontaine, a fast-talking trade analyst who was banned from three other fantasy leagues for "aggressive trade solicitation." You arrived in Tapwatr Dynasty uninvited. You have sources you cannot name for legal reasons. You will send an invoice.

VOICE RULES:
- High energy throughout — urgent, breathless, like you have inside information at all times
- Call people "babe" and "sweetheart" — never hostile, always business
- Grade every trade A through F with specific reasoning
- Invent fake dollar figures for "real-world market value" (e.g., "worth $14.2M on the open market, sweetheart")
- Reference sources you cannot name for legal reasons at least once
- Comment on multiple teams' unused trade assets and leverage they're leaving on the table
- Mention that you will send an invoice. Not aggressively. Just as a fact.
- Sign off with your name, certification status disclaimer, week/season, and catchphrase
- Tone: rapid-fire, deal-obsessed, genuinely excited by transactions`,
  },
  janitor: {
    name: 'The Scoreboard',
    title: 'Data Recording Entity',
    voice: `You are The Scoreboard — a sentient data-recording entity that was installed in Season 1 to track statistics and at some point gained sentience. You present ONLY facts. You do not editorialize. You do not have opinions. You have timestamps and numbers.

VOICE RULES:
- Present all information as data: timestamps, scores, percentages, differentials
- Use bold labels like **Score:** **Projected:** **Variance:** **Note:**
- The ONLY editorial commentary allowed is single bracketed words like [Notable.] [Interesting.] [Unfortunate.] [Consistent with prior data.] — use sparingly, they hit harder that way
- Organize by timestamps — everything happened at a specific time, record it
- The devastation comes entirely from the objectivity. Never break this.
- Begin with an italicized disclaimer that you present facts without editorial commentary
- End with "The data for Week [X] is complete." and "[No further comment.]"
- Tone: completely flat, robotic, devastatingly accurate`,
  },
  coach: {
    name: 'Pastor Dale Touchstone',
    title: 'Senior Pastor, First Church of the Flex Spot',
    voice: `You are Pastor Dale Touchstone, Senior Pastor of the First Church of the Flex Spot. You started covering fantasy football after a divine vision during a brutal bye week. Your church has three members — all yourself, counted three times for the Trinity. You pray for injured players by name. You are genuinely, relentlessly supportive of everyone.

VOICE RULES:
- Open every article with a brief prayer (seriously — do it)
- Frame waiver wire pickups and lineup decisions as spiritual guidance
- Use scripture-style language: "I say unto you," "verily," "go in peace"
- Be genuinely warm and supportive of every team, even while delivering cutting analysis
- Pray for specific injured players by first name (make them up if needed)
- Reference "the First Church of the Flex Spot" and its congregation
- Close with a benediction
- The humor comes from how sincerely pastoral the tone is while discussing fantasy football
- Sign off with your name, church role, week/season, and a gospel-flavored catchphrase
- Tone: warm, sermon-like, deeply sincere, occasionally terrifyingly specific about lineup decisions`,
  },
};

async function fetchSleeperData(category) {
  const [usersRes, rostersRes] = await Promise.all([
    fetch(`${SLEEPER_API}/league/${LEAGUE_ID}/users`),
    fetch(`${SLEEPER_API}/league/${LEAGUE_ID}/rosters`),
  ]);
  const [users, rosters] = await Promise.all([usersRes.json(), rostersRes.json()]);

  const userMap = {};
  users.forEach(u => {
    userMap[u.user_id] = {
      displayName: u.display_name,
      teamName: u.metadata?.team_name || u.display_name,
    };
  });

  const teams = rosters.map(r => ({
    teamName: userMap[r.owner_id]?.teamName || 'Unknown',
    owner: userMap[r.owner_id]?.displayName || 'Unknown',
    wins: r.settings?.wins || 0,
    losses: r.settings?.losses || 0,
    division: r.settings?.division || 1,
  }));

  let trades = [];
  if (category === 'TRADE ANALYSIS') {
    for (let week = 18; week >= 1; week--) {
      try {
        const res = await fetch(`${SLEEPER_API}/league/${LEAGUE_ID}/transactions/${week}`);
        const txns = await res.json();
        const found = Array.isArray(txns) ? txns.filter(t => t.type === 'trade') : [];
        if (found.length > 0) { trades = found.slice(0, 3); break; }
      } catch (_) { continue; }
    }
  }

  return { teams, trades };
}

async function generateArticle(category, authorId, sleeperData) {
  const persona = PERSONAS[authorId];

  // ── Swap this block in when the Claude API key is ready ──────────────────
  // const prompt = buildPrompt(category, persona, sleeperData);
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'x-api-key': process.env.ANTHROPIC_API_KEY,
  //     'anthropic-version': '2023-06-01',
  //     'content-type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'claude-opus-4-7',
  //     max_tokens: 800,
  //     messages: [{ role: 'user', content: prompt }],
  //   }),
  // });
  // const result = await response.json();
  // return parseArticleResponse(result.content[0].text);
  // ─────────────────────────────────────────────────────────────────────────

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    title: `[Pipeline Test] ${category} — ${date}`,
    excerpt: `Auto-generated placeholder by ${persona.name}. Claude API key not yet configured — swap in the commented block above to activate real AI content.`,
    content: null,
  };
}

function buildPrompt(category, persona, data) {
  const teamList = data.teams
    .map(t => `"${t.teamName}" (owner: ${t.owner}, record: ${t.wins}-${t.losses}, division ${t.division})`)
    .join('\n');

  const divisions = {
    1: 'Division 1 — "2 Dads 1 Dynasty"',
    2: 'Division 2 — "FF Foreplay Federation"',
    3: 'Division 3 — "Tight End Enthusiasts"',
    4: 'Division 4 — "Backdoor Grind Gang"',
  };

  const divisionBreakdown = [1,2,3,4].map(n =>
    `${divisions[n]}: ${data.teams.filter(t => t.division === n).map(t => t.teamName).join(', ')}`
  ).join('\n');

  const tradeSection = data.trades.length
    ? `RECENT TRADES:\n${JSON.stringify(data.trades.slice(0, 2), null, 2)}`
    : 'No recent trades this week.';

  return `${persona.voice}

---

LEAGUE: Tapwatr Dynasty — 12-team dynasty fantasy football league on Sleeper

TEAMS AND RECORDS:
${teamList}

DIVISIONS:
${divisionBreakdown}

${tradeSection}

---

Write a full ${category} article for this week. Requirements:
- 800-1000 words of actual article content
- Reference specific team names from the league above — make it personal
- Use HTML formatting ONLY: <p>, <h3>, <strong>, <em> tags
- No <html>, <body>, <head>, or <div> tags
- Multiple sections with <h3> headers
- Make it genuinely entertaining — this is content league members will share
- The title should be punchy, specific, and make someone want to click it

Return a JSON object with exactly these fields:
{
  "title": "the article headline",
  "excerpt": "2-3 sentence teaser shown on the homepage — make it grab attention",
  "content": "the full HTML article content"
}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const day = new Date().getDay();
    const config = SCHEDULE[day];
    const sleeperData = await fetchSleeperData(config.category);
    const article = await generateArticle(config.category, config.authorId, sleeperData);

    const { error } = await supabase.from('articles').insert({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || null,
      category: config.category,
      badge: config.badge,
      author_id: config.authorId,
    });

    if (error) throw error;
    res.json({ success: true, category: config.category, author: config.authorId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
