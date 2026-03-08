'use client';

import { ReconstructionWidget } from '@/components/widgets/ReconstructionWidget';
import { CultureWidget } from '@/components/widgets/CultureWidget';
import { ReforestationWidget } from '@/components/widgets/ReforestationWidget';

export function SectionLumiere() {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-3 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <ReconstructionWidget />
      <CultureWidget />
      <ReforestationWidget />
    </section>
  );
}
