'use client';

import { CloudflareWidget } from '@/components/widgets/CloudflareWidget';
import { OpenSkyWidget } from '@/components/widgets/OpenSkyWidget';
import { PortWidget } from '@/components/widgets/PortWidget';
import { JammingWidget } from '@/components/widgets/JammingWidget';
import { EDLWidget } from '@/components/widgets/EDLWidget';
import { AirportPulseWidget } from '@/components/widgets/AirportPulseWidget';
import { DataFreshnessWidget } from '@/components/widgets/DataFreshnessWidget';

export function SectionInfrastructure() {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <CloudflareWidget />
      <OpenSkyWidget />
      <PortWidget />
      <JammingWidget />
      <EDLWidget />
      <AirportPulseWidget />
      <DataFreshnessWidget />
    </section>
  );
}
