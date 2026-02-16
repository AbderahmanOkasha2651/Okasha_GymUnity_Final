import React from 'react';
import { ArchitectureFlow } from '../../components/ArchitectureFlow';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#111] pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <ArchitectureFlow />
      </div>
    </div>
  );
};
