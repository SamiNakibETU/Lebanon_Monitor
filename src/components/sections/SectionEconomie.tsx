'use client';

import { LBPWidget } from '@/components/widgets/LBPWidget';
import { FuelWidget } from '@/components/widgets/FuelWidget';
import { AirQualityWidget } from '@/components/widgets/AirQualityWidget';

export function SectionEconomie() {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-3 gap-px w-full"
      style={{ background: '#000000' }}
    >
      <LBPWidget />
      <FuelWidget />
      <AirQualityWidget />
    </section>
  );
}
