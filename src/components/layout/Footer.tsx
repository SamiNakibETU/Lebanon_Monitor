'use client';

export function Footer() {
  return (
    <footer
      className="flex items-center justify-center gap-4 px-4 py-3 text-[10px]"
      style={{
        background: '#000000',
        color: '#666666',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span>GDELT · ACLED · USGS · NASA · ReliefWeb · Telegram</span>
      <a
        href="https://polymarket.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#888] transition-colors"
      >
        Polymarket
      </a>
    </footer>
  );
}
