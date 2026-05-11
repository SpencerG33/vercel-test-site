const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, category, badge, author_id, published_at, week, season')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
