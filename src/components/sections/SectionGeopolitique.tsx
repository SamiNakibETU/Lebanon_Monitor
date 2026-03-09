'use client';

import { PolymarketWidget } from '@/components/widgets/PolymarketWidget';
import { ACLEDMiniMap } from '@/components/widgets/ACLEDMiniMap';
import { UNIFILWidget } from '@/components/widgets/UNIFILWidget';
import { RegionalWidget } from '@/components/widgets/RegionalWidget';
import { SignalsWidget } from '@/components/widgets/SignalsWidget';
import { ConflictGauge } from '@/components/charts/ConflictGauge';
import { ReliefWebWidget } from '@/components/widgets/ReliefWebWidget';
import { CausalTimelineWidget } from '@/components/widgets/CausalTimelineWidget';

export function SectionGeopolitique() {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <div style={{ background: '#0A0A0A' }}>
        <ConflictGauge />
      </div>
      <div style={{ background: '#0A0A0A' }}>
        <ACLEDMiniMap />
      </div>
      <div style={{ background: '#0A0A0A' }}>
        <div className="p-4">
          <PolymarketWidget />
        </div>
      </div>
      <div style={{ background: '#0A0A0A' }}>
        <RegionalWidget />
      </div>
      <div className="md:col-span-2" style={{ background: '#0A0A0A' }}>
        <SignalsWidget />
      </div>
      <div className="md:col-span-2" style={{ background: '#0A0A0A' }}>
        <CausalTimelineWidget />
      </div>
      <div style={{ background: '#0A0A0A' }}>
        <UNIFILWidget />
      </div>
      <div style={{ background: '#0A0A0A' }}>
        <ReliefWebWidget />
      </div>
    </section>
  );
}
