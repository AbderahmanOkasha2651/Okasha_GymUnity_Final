import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { Button } from './ui/Button';

export const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1578924608828-79a71150f711?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZpdG5lc3MlMjBtYW58ZW58MHwwfDB8fHww" 
          alt="Person working on laptop" 
          className="object-cover w-full h-full opacity-90"
        />
        {/* Dark Gradient Overlay to match the mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 text-center">
        
        {/* Powered By Badge */}
        <div className="mb-6 group">
          <a href="#" className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white/90 transition-all bg-white/10 border border-white/20 rounded-full backdrop-blur-sm hover:bg-white/20">
            Powered by Toloka
            <ArrowUpRight size={12} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Main Headline */}
        <h1 className="max-w-4xl mb-6 text-4xl font-medium tracking-tight text-white md:text-6xl lg:text-[64px] leading-[1.1]">
          Share what you know,<br className="hidden md:block" /> shape what's next
        </h1>

        {/* Subheadline */}
        <p className="max-w-xl mb-10 text-base leading-relaxed text-white/90 md:text-lg">
          Help teach AI how professionals think — <br className="hidden sm:block" />
          from clinical decisions to creative insights
        </p>

        {/* CTA Button */}
        <div className="mb-20">
             <Button className="px-8 py-3 text-base !bg-mindrift-green !hover:bg-mindrift-greenHover shadow-[0_0_20px_rgba(184,243,137,0.4)]">
                Apply now
             </Button>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce">
            <ArrowDown className="text-white/80" size={24} />
        </div>

      </div>
    </div>
  );
};