export default function CommunityPage() {
  const topics = [
    { id: 1, title: 'General Discussion', icon: '💬', posts: 134, div: 'all' },
    { id: 2, title: 'Gaming Scrims & Teams', icon: '🎮', posts: 87, div: 'gaming' },
    { id: 3, title: 'Music Drops & Collabs', icon: '🎵', posts: 56, div: 'music' },
    { id: 4, title: 'Sport Challenge Results', icon: '💪', posts: 72, div: 'sport' },
    { id: 5, title: 'Content & Memes', icon: '🎬', posts: 201, div: 'content' },
    { id: 6, title: 'Merch & Gear Talk', icon: '👕', posts: 44, div: 'all' },
  ];

  const recent = [
    { author: 'XenonX', action: 'posted in', topic: 'General Discussion', time: '2min ago' },
    { author: 'BeatLord', action: 'dropped a track in', topic: 'Music Drops & Collabs', time: '15min ago' },
    { author: 'IronWolf', action: 'shared a PR in', topic: 'Sport Challenge Results', time: '1h ago' },
    { author: 'ClipMaster', action: 'posted a meme in', topic: 'Content & Memes', time: '2h ago' },
  ];

  const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', all: 'tag-all' };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <section style={{ position: 'relative', padding: '5rem 0 3rem', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(255,0,0,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div className="container">
          <div className="section-tag">Community</div>
          <h1>Brotherhood <span className="gradient-text">Forums</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Connect, discuss, share. The Brotherhood never sleeps.
          </p>
        </div>
      </section>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Topics */}
          <div>
            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Discussion Topics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topics.map(t => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} id={`community-topic-${t.id}`}>
                  <span style={{ fontSize: '2rem' }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.05rem' }}>{t.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{t.posts} posts</div>
                  </div>
                  <span className={`division-tag ${divTagClass[t.div]}`}>{t.div}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Full forum functionality coming in Phase 3. Join the Discord in the meantime!
              </p>
              <a href="#" className="btn btn-primary" id="community-discord-btn">Join Discord</a>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h4 style={{ fontFamily: 'Rajdhani', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Recent Activity</h4>
              {recent.map((r, i) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ color: 'var(--neon-blue)', fontWeight: 600, fontSize: '0.85rem' }}>{r.author}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}> {r.action} </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.topic}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{r.time}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(204,0,0,0.1), rgba(255,0,0,0.05))' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚔️</div>
              <h4 style={{ fontFamily: 'Rajdhani', fontWeight: 700, marginBottom: '0.5rem' }}>New Member?</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Start your journey. Join a division.</p>
              <a href="/join" className="btn btn-primary btn-sm" id="community-join-btn" style={{ width: '100%', justifyContent: 'center' }}>Apply Now</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
