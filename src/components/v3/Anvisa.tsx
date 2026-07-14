// Regulatory badge referencing Anvisa norms.
// Responsible wording: this is a compliance-orientation badge, NOT an assertion
// of a specific certification. Real licenses are registered/validated in the admin panel.
export function AnvisaBadge({ compact = false }: { compact?: boolean }) {
  return <Anvisa compact={compact} />;
}

export function Anvisa({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`anvisa-badge ${compact ? "compact" : ""}`}
         title="Operação orientada às normas da Anvisa. Licenças e documentos validados no painel administrativo.">
      <div className="anvisa-shield">
        <svg viewBox="0 0 24 28" width="22" height="26" aria-hidden="true">
          <defs>
            <linearGradient id="anv-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2FE6E0"/>
              <stop offset="100%" stopColor="#3B7BFF"/>
            </linearGradient>
          </defs>
          <path d="M12 1.5l9 3.2v7.4c0 6.2-4 11.2-9 12.9-5-1.7-9-6.7-9-12.9V4.7l9-3.2z"
            fill="rgba(47,230,224,.10)" stroke="url(#anv-g)" strokeWidth="1.4"/>
          <path d="M12 6.4v8M8 10.4h8" stroke="url(#anv-g)" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8.4 17.6h7.2" stroke="url(#anv-g)" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="anvisa-txt">
        <div className="anvisa-name">ANVISA<span className="anvisa-reg">·</span></div>
        {!compact && <div className="anvisa-sub">Operação orientada às normas regulatórias</div>}
      </div>
    </div>
  );
}
