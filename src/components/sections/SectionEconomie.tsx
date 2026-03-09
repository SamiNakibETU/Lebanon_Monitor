'use client';

import { LBPWidget } from '@/components/widgets/LBPWidget';
import { FuelWidget } from '@/components/widgets/FuelWidget';
import { AirQualityWidget } from '@/components/widgets/AirQualityWidget';
import { LBPTrendChart } from '@/components/charts/LBPTrendChart';
import { GoldWidget } from '@/components/widgets/GoldWidget';

export function SectionEconomie() {
  return (
    <section style={{ background: '#000000' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px w-full">
        <div className="flex flex-col" style={{ background: '#0A0A0A' }}>
          <LBPWidget />
          <div className="px-4 pb-4">
            <LBPTrendChart />
          </div>
        </div>
        <FuelWidget />
        <GoldWidget />
        <AirQualityWidget />
      </div>
    </section>
  );
}
