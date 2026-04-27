export default function CommunityPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="section-tag animate-fade-down">Phase 3</div>
        <h1 className="animate-fade-up">
          Community <span className="gradient-text">Hub</span>
        </h1>
        <div 
          className="neon-divider animate-fade-up" 
          style={{ margin: '2rem auto' }} 
        />
        <p 
          className="animate-fade-up" 
          style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.2rem', 
            maxWidth: '600px', 
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}
        >
          A unified space for the Brotherhood to connect, collaborate, and compete. 
          Forums, direct messaging, and squad recruitment are currently under construction.
        </p>

        <div className="grid-3 animate-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {[
            { icon: '💬', title: 'Global Forums', desc: 'Discuss strategy and meta across all divisions.' },
            { icon: '🤝', title: 'Squad Finder', desc: 'Find your brothers for the next big challenge.' },
            { icon: '⚡', title: 'Live Chat', desc: 'Real-time communication with the entire community.' }
          ].map((feature, i) => (
            <div key={i} className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h4 style={{ marginBottom: '0.5rem' }}>{feature.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-up" style={{ marginTop: '4rem' }}>
          <div className="card" style={{ 
            display: 'inline-block', 
            padding: '1.5rem 3rem', 
            background: 'linear-gradient(135deg, rgba(255,0,0,0.1), transparent)',
            border: '1px solid var(--brand-red)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Join our Discord to stay updated on the launch.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="https://discord.gg/bhl" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Join Discord
              </a>
              <a href="https://github.com/samishating/bhl_website" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View Source
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

