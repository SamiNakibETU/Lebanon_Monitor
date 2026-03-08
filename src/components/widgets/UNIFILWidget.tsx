'use client';

export function UNIFILWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        UNIFIL Status
      </div>
      <div className="text-[14px] leading-relaxed" style={{ color: '#FFFFFF' }}>
        Dernier communiqué — à venir
      </div>
    </div>
  );
}
