const LEAGUE_ID = '1316190343179284480';
const SLEEPER_API = 'https://api.sleeper.app/v1';

const personas = [
  {
    id: 'bigrick',
    name: 'Big Rick Fernandez',
    title: "The Commissioner's Voice",
    covers: ['Weekly Recaps', 'Standings', 'League Drama'],
    bio: "Big Rick has been covering the Tapwatr Dynasty since the first pick was ever made. A man of few kind words and many cold takes that somehow keep being right. If you want a sugar-coated breakdown, keep scrolling.",
    catchphrase: '"Numbers don\'t lie. But your lineup does."',
    initials: 'BRF',
    color: '#5b9cf6',
    bg: 'rgba(91,156,246,0.15)',
  },
  {
    id: 'anita',
    name: "Anita O'Dds",
    title: 'The Quantifier',
    covers: ['Power Rankings', 'Analytics', 'Win Probability'],
    bio: "Former poker player turned fantasy analyst. Anita doesn't care about your feelings — only your efficiency metrics. She built a custom model for this league and it disrespects everyone equally.",
    catchphrase: '"Your gut feeling is a liability."',
    initials: 'AO',
    color: '#f5b942',
    bg: 'rgba(245,185,66,0.15)',
  },
  {
    id: 'dtrain',
    name: '"D-Train" Marcus Davis',
    title: 'The Insider',
    covers: ['Trade Analysis', 'Transactions', 'Hot Takes'],
    bio: "D-Train's phone blows up every time a trade drops. Nobody knows his sources but nobody has been able to refute them either. Speaks exclusively in exclamation points and trade grades.",
    catchphrase: '"This trade is either an A+ or a career-ender. No in-between."',
    initials: 'MD',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)',
  },
  {
    id: 'janitor',
    name: 'The Janitor',
    title: 'Cleaning Up Messes Since Season 1',
    covers: ["Loser's Corner", 'Shame of the Week', 'Brutal Honesty'],
    bio: "Identity: unknown. Motivations: unclear. What we do know is that The Janitor has been mopping up the league's worst performances with surgical precision and zero mercy. Some theories exist. None confirmed.",
    catchphrase: '"Someone\'s gotta mop this up."',
    initials: '???',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.15)',
  },
  {
    id: 'coach',
    name: 'Coach T. Kowalski',
    title: 'The Strategist',
    covers: ['Lineup Advice', 'Injury Reports', 'Waiver Wire'],
    bio: "Thirty years on the sidelines. Now watching from a recliner, judging your lineup decisions. Coach T doesn't sugarcoat anything and will bench your favorite player without a second thought if the matchup says so.",
    catchphrase: '"Trust the process. I\'ve seen it all, and I\'ve seen worse than you."',
    initials: 'TK',
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.15)',
  },
];

// Articles are loaded from Supabase via /api/articles — see loadArticles()
let articles = [];

function getPersona(id) {
  return personas.find(p => p.id === id) || personas[0];
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeArticle(a) {
  return {
    ...a,
    authorId: a.author_id || a.authorId,
    date: a.published_at ? formatDate(a.published_at) : (a.date || ''),
    readTime: a.readTime || '3 min read',
  };
}

function renderFeaturedArticle() {
  const el = document.getElementById('featured-article');
  if (!el) return;
  const raw = articles[0];
  if (!raw) return;
  const article = normalizeArticle(raw);
  const author = getPersona(article.authorId);

  el.innerHTML = `
    <div class="featured-card">
      <div class="featured-body">
        <div class="featured-label">FEATURED ARTICLE</div>
        <div style="margin-bottom:1rem"><span class="badge ${article.badge}">${article.category}</span></div>
        <h2 class="featured-title">${article.title}</h2>
        <p class="featured-excerpt">${article.excerpt}</p>
        <div class="featured-author">
          <div class="featured-author-avatar" style="background:${author.bg};color:${author.color}">${author.initials}</div>
          <div class="featured-author-info">
            <div class="name">${author.name}</div>
            <div class="role">${author.title} &nbsp;·&nbsp; ${article.date} &nbsp;·&nbsp; ${article.readTime}</div>
          </div>
        </div>
      </div>
      <div class="featured-visual">
        <div class="featured-visual-bg">${article.visualLabel || ''}</div>
        <div class="featured-visual-inner">
          <div class="featured-visual-title" style="color:${author.color}">${article.visualLabel || 'WEEK 14'}</div>
          <div class="featured-visual-subtitle">${article.visualSub || 'RECAP'}</div>
        </div>
      </div>
    </div>
  `;
}

function renderArticles(filter) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;
  const pool = articles.slice(1); // first article is featured
  const list = (!filter || filter === 'ALL') ? pool : pool.filter(a => a.category === filter);

  grid.innerHTML = list.map(raw => {
    const a = normalizeArticle(raw);
    const author = getPersona(a.authorId);
    return `
      <div class="article-card">
        <div class="article-card-meta">
          <span class="badge ${a.badge}">${a.category}</span>
          <span class="article-card-date">${a.date}</span>
        </div>
        <div class="article-card-title">${a.title}</div>
        <div class="article-card-excerpt">${a.excerpt}</div>
        <div class="article-card-footer">
          <div class="author-pill">
            <div class="author-avatar" style="background:${author.bg};color:${author.color}">${author.initials}</div>
            <span class="author-name">${author.name}</span>
          </div>
          <span class="read-time">${a.readTime}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderFilters() {
  const el = document.getElementById('category-filters');
  if (!el) return;
  const cats = ['ALL', ...new Set(articles.slice(1).map(a => a.category))];
  el.innerHTML = cats.map((c, i) =>
    `<button class="filter-btn${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderArticles(btn.dataset.cat);
  });
}

function renderDivisions(users, rosters, leagueInfo) {
  const el = document.getElementById('divisions-grid');
  if (!el) return;

  const divNames = {
    1: leagueInfo.metadata?.division_1 || 'Division 1',
    2: leagueInfo.metadata?.division_2 || 'Division 2',
    3: leagueInfo.metadata?.division_3 || 'Division 3',
    4: leagueInfo.metadata?.division_4 || 'Division 4',
  };

  const userMap = {};
  users.forEach(u => { userMap[u.user_id] = u; });

  const divs = { 1: [], 2: [], 3: [], 4: [] };
  rosters.forEach(r => {
    const u = userMap[r.owner_id];
    if (!u) return;
    const div = r.settings?.division || 1;
    divs[div].push({
      teamName: u.metadata?.team_name || u.display_name,
      owner: u.display_name,
      wins: r.settings?.wins || 0,
      losses: r.settings?.losses || 0,
    });
  });

  Object.values(divs).forEach(d => d.sort((a, b) => b.wins - a.wins || a.losses - b.losses));

  el.innerHTML = [1, 2, 3, 4].map(n => `
    <div class="division-card">
      <div class="division-header">
        <div class="division-name">${divNames[n]}</div>
      </div>
      <div class="team-list">
        ${divs[n].map((t, i) => `
          <div class="team-item">
            <div class="team-rank">${i + 1}</div>
            <div class="team-info">
              <div class="team-name">${t.teamName}</div>
              <div class="team-owner">${t.owner}</div>
            </div>
            <div class="team-record">${t.wins}-${t.losses}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderPersonas() {
  const grid = document.getElementById('personas-grid');
  if (!grid) return;
  grid.innerHTML = personas.map(p => `
    <div class="persona-card">
      <div class="persona-header">
        <div class="persona-avatar" style="background:${p.bg};color:${p.color}">${p.initials}</div>
        <div>
          <div class="persona-name">${p.name}</div>
          <div class="persona-title">${p.title}</div>
        </div>
      </div>
      <p class="persona-bio">${p.bio}</p>
      <div class="persona-covers">
        ${p.covers.map(c => `<span class="persona-cover-tag">${c}</span>`).join('')}
      </div>
      <div class="persona-catchphrase">${p.catchphrase}</div>
    </div>
  `).join('');
}

async function loadArticles() {
  try {
    const res = await fetch('/api/articles');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) articles = data;
  } catch (e) {
    console.warn('Could not load articles from API, using fallback:', e.message);
  }
}

async function fetchLeagueData() {
  try {
    const [lRes, uRes, rRes] = await Promise.all([
      fetch(`${SLEEPER_API}/league/${LEAGUE_ID}`),
      fetch(`${SLEEPER_API}/league/${LEAGUE_ID}/users`),
      fetch(`${SLEEPER_API}/league/${LEAGUE_ID}/rosters`),
    ]);
    const [leagueInfo, users, rosters] = await Promise.all([lRes.json(), uRes.json(), rRes.json()]);
    return { leagueInfo, users, rosters };
  } catch (e) {
    console.error('Sleeper API error:', e);
    return null;
  }
}

async function init() {
  await loadArticles();
  renderFeaturedArticle();
  renderArticles();
  renderFilters();
  renderPersonas();

  const data = await fetchLeagueData();
  if (data) {
    const { leagueInfo, users, rosters } = data;
    renderDivisions(users, rosters, leagueInfo);
  } else {
    const el = document.getElementById('divisions-grid');
    if (el) el.innerHTML = '<div class="loading">Could not load league data.</div>';
  }
}

init();
