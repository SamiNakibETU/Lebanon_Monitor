'use client';

import { CloudflareWidget } from '@/components/widgets/CloudflareWidget';
import { OpenSkyWidget } from '@/components/widgets/OpenSkyWidget';
import { PortWidget } from '@/components/widgets/PortWidget';
import { JammingWidget } from '@/components/widgets/JammingWidget';

export function SectionInfrastructure() {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <CloudflareWidget />
      <OpenSkyWidget />
      <PortWidget />
      <JammingWidget />
    </section>
  );
}
