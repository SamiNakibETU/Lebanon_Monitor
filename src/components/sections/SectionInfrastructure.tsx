'use client';

import { CloudflareWidget } from '@/components/widgets/CloudflareWidget';
import { OpenSkyWidget } from '@/components/widgets/OpenSkyWidget';
import { AirportPulseWidget } from '@/components/widgets/AirportPulseWidget';
import { CCTVWidget } from '@/components/widgets/CCTVWidget';
import { DataFreshnessWidget } from '@/components/widgets/DataFreshnessWidget';
import { JammingWidget } from '@/components/widgets/JammingWidget';

export function SectionInfrastructure() {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <CloudflareWidget />
      <OpenSkyWidget />
      <AirportPulseWidget />
      <CCTVWidget />
      <JammingWidget />
      <DataFreshnessWidget />
    </section>
  );
}
