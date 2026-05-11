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
  bigrick: { name: 'Big Rick Fernandez', voice: 'a gruff, no-nonsense beat reporter who has seen everything and is impressed by nothing. Direct. Slightly cynical. Always right.' },
  anita:   { name: "Anita O'Dds",        voice: 'a cold, data-driven analyst. Speaks in probabilities and efficiency metrics. Quietly ruthless. Makes the numbers do the trash-talking.' },
  dtrain:  { name: '"D-Train" Marcus Davis', voice: 'a loud, excitable sports agent type. Always has inside info. Grades every trade A through F. Uses a lot of exclamation points.' },
  janitor: { name: 'The Janitor',        voice: 'an anonymous, brutal critic. Identity unknown. Zero mercy. Surgical takedowns of the worst performances. Short sentences. No sympathy.' },
  coach:   { name: 'Coach T. Kowalski',  voice: 'a veteran football coach who uses gridiron analogies for everything. Practical. Authoritative. Will bench your favorite player without hesitation.' },
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
    excerpt: `Auto-generated placeholder by ${persona.name}. Claude API key not yet configured — swap in the block above to activate real AI content.`,
  };
}

function buildPrompt(category, persona, data) {
  const teamList = data.teams.map(t => `${t.teamName} (${t.wins}-${t.losses})`).join(', ');
  const tradeInfo = data.trades.length
    ? `Recent trades: ${JSON.stringify(data.trades)}`
    : 'No recent trades.';

  return `You are ${persona.name}, writing for the Tapwatr Dynasty fantasy football league website.
Your writing voice: ${persona.voice}

League teams and records: ${teamList}
${tradeInfo}

Write a ${category} article in your voice. Return JSON with exactly two fields:
{ "title": "...", "excerpt": "2-3 sentence summary used as the article preview..." }

Keep the title punchy and specific to this league. Reference real team names. Be entertaining.`;
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
