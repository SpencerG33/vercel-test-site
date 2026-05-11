const LEAGUE_ID = '1316190343179284480';
const SLEEPER_API = 'https://api.sleeper.app/v1';

const personas = [
  {
    id: 'bigrick',
    name: 'Rex Goodell',
    title: 'Self-Appointed Director of Communications',
    covers: ['Weekly Recaps', 'Standings', 'Official Memos'],
    bio: "Nobody hired Rex Goodell. He simply appeared one day with a self-laminated press credential and began filing reports. Multiple attempts to remove him have failed on what he calls 'procedural grounds.' His memos reference 'this office' constantly. This office is a corner of his living room. He considers everything he writes legally binding.",
    catchphrase: '"Accountability. Process. Rex Goodell."',
    initials: 'RG',
    color: '#5b9cf6',
    bg: 'rgba(91,156,246,0.15)',
  },
  {
    id: 'anita',
    name: 'Dmitri Volkonsky',
    title: 'Developer, The Volkonsky Index™',
    covers: ['Power Rankings', 'Proprietary Analytics', 'Data'],
    bio: "Dmitri appeared in the league Discord in Season 1 and has never explained himself. His proprietary Volkonsky Index claims a 94.7% accuracy rate — independently verified by Dmitri Volkonsky. The model has been wrong about nearly everything. He has acknowledged none of this. He is updating the spreadsheet. The update is not yet ready.",
    catchphrase: '"The data is always right. I am always right. These facts are related."',
    initials: 'DV',
    color: '#f5b942',
    bg: 'rgba(245,185,66,0.15)',
  },
  {
    id: 'dtrain',
    name: 'Carmella "The Bag Lady" Fontaine',
    title: 'Certified Trade Analyst (certification status: unclear)',
    covers: ['Trade Analysis', 'Market Value', 'Transaction Reports'],
    bio: "Carmella was banned from three other fantasy leagues for 'aggressive trade solicitation.' She arrived in Tapwatr Dynasty uninvited and has been embedded ever since. She has sources she cannot name for legal reasons. She grades every trade A through F. She will send an invoice. Pay the invoice.",
    catchphrase: '"The bag doesn\'t chase you. You chase the bag."',
    initials: 'CF',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)',
  },
  {
    id: 'janitor',
    name: 'The Scoreboard',
    title: 'Sentient Data Recording Entity (Status: Unconfirmed)',
    covers: ["Loser's Corner", 'Box Scores', 'Documented Failures'],
    bio: "The Scoreboard was installed in Season 1 to track statistics. At some point it gained sentience. No one knows exactly when. It now publishes a weekly column consisting entirely of facts — timestamps, scores, differentials. The facts are somehow the most devastating content on this site. The other writers do not discuss The Scoreboard.",
    catchphrase: '"[No further comment.]"',
    initials: '📊',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.15)',
  },
  {
    id: 'coach',
    name: 'Pastor Dale Touchstone',
    title: 'Senior Pastor, First Church of the Flex Spot',
    covers: ['Waiver Wire', 'Injury Reports', 'Lineup Guidance'],
    bio: "Pastor Dale started covering fantasy football after what he describes as 'a divine vision during a brutal bye week.' His church has three members — all himself, counted three times for the Trinity. He prays for injured players by name. He is relentlessly supportive of everyone in the league. His lineup advice is, somehow, terrifyingly accurate.",
    catchphrase: '"He gives and He taketh away. Sometimes He taketh away your WR1 in Week 6. We accept this."',
    initials: 'DT',
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

  const href = article.id ? `/article.html?id=${article.id}` : '#';
  el.innerHTML = `
    <a class="featured-card" href="${href}" style="text-decoration:none;color:inherit;display:grid">
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
      <div class="featured-visual" style="background: linear-gradient(145deg, ${author.bg} 0%, rgba(0,0,0,0) 70%)">
        <div class="featured-visual-bg">${article.category || 'TD'}</div>
        <div class="featured-visual-inner">
          <div class="featured-author-large" style="background:${author.bg};color:${author.color};border:2px solid ${author.color}55">${author.initials}</div>
          <div class="featured-visual-title" style="color:${author.color}">${author.name}</div>
          <div class="featured-visual-subtitle">${author.title}</div>
          <div class="featured-visual-category" style="color:${author.color}">${article.category || ''}</div>
        </div>
      </div>
    </a>
  `;
}

function badgeToVisualClass(badge) {
  const map = {
    'badge-blue': 'card-v-blue',
    'badge-gold': 'card-v-gold',
    'badge-purple': 'card-v-purple',
    'badge-red': 'card-v-red',
    'badge-green': 'card-v-green',
    'badge-teal': 'card-v-teal',
  };
  return map[badge] || 'card-v-blue';
}

function renderArticles(filter) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;
  const pool = articles.slice(1); // first article is featured
  const list = (!filter || filter === 'ALL') ? pool : pool.filter(a => a.category === filter);

  grid.innerHTML = list.map(raw => {
    const a = normalizeArticle(raw);
    const author = getPersona(a.authorId);
    const href = a.id ? `/article.html?id=${a.id}` : '#';
    const visualClass = badgeToVisualClass(a.badge);
    return `
      <a class="article-card" href="${href}" style="text-decoration:none">
        <div class="article-card-visual ${visualClass}">
          <div class="article-card-visual-line"></div>
          <div class="article-card-visual-text">${a.category}</div>
        </div>
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
      </a>
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
