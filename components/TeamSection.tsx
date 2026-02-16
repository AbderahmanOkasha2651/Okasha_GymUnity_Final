import React from 'react';

type TeamMember = {
  name: string;
  title: string;
  quote: string;
  image: string;
  accent: string;
  doodle: string;
};

const TEAM_MEMBERS: TeamMember[] = [

  {
    name: 'Abderahman Okasha',
    title: 'Data/Backend Engineer',
    quote: 'Keeps our data pipelines clean and backend APIs reliable so the AI experience stays fast.',
    image: 'public/abderahman-okasha.jpg',
    accent: 'bg-[#B37CFF]',
    doodle: 'text-[#E6D8FF]',
  },

  {
    name: 'Ahmed Oraby',
    title: 'AI Developer',
    quote: 'Builds and fine-tunes the AI that powers smarter coaching for every athlete.',
    image: '/ahmed-oraby.jpg',
    accent: 'bg-[#6AD2FF]',
    doodle: 'text-[#D8F3FF]',
  },
  {
    name: 'Youssef Tamer',
    title: 'Mobile Developer',
    quote: 'Brings the GymUnity experience to your pocket with fast, reliable mobile apps.',
    image: '/youssef-tamer.jpg',
    accent: 'bg-[#FF9F6E]',
    doodle: 'text-[#FFE1D2]',
  },
  {
    name: 'Ismaeel Abdelmaqsoud',
    title: 'ML Engineer',
    quote: 'Designs and optimizes models so the coaching stays smart, fast, and reliable.',
    image: '/ismaeel-abdelmaqsoud.jpg',
    accent: 'bg-[#9B8CFF]',
    doodle: 'text-[#E6E0FF]',
  },
];

const cardMarqueeStyles = `
@keyframes teamCardsMarquee {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}
.team-cards__scroller {
  overflow: hidden;
}
.team-cards__track {
  display: flex;
  gap: 1.25rem;
  width: max-content;
  will-change: transform;
  animation: teamCardsMarquee var(--card-speed, 40s) linear infinite;
}
.team-cards__card {
  width: 340px;
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (prefers-reduced-motion: reduce) {
  .team-cards__track {
    animation: none !important;
  }
  .team-cards__scroller {
    overflow-x: auto;
  }
}
`;

export const TeamSection: React.FC = () => {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#F5EFE8] px-6 pt-20 pb-32 text-[#222326] sm:px-10 lg:px-16 lg:pb-36"
    >
      <div className="mx-auto max-w-7xl">
        <style>{cardMarqueeStyles}</style>

        <div
          className={`transition-all duration-700 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
        >
          <h2 className="max-w-xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Meet the minds
            <br />
            behind the AI
          </h2>
        </div>

        <div className="mt-12">
          <div className="team-cards__scroller">
            <div
              className="team-cards__track"
              style={{ ['--card-speed' as string]: '80s' }}
            >
              {[...TEAM_MEMBERS, ...TEAM_MEMBERS].map((person, index) => (
                <article
                  key={`${person.name}-${index}`}
                  className={`team-cards__card transition-all duration-700 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                  style={{ transitionDelay: `${120 + (index % TEAM_MEMBERS.length) * 140}ms` }}
                >
                  <div className="rounded-[30px] bg-[#F2ECE6] p-2">
                    <div
                      className={`relative h-72 w-full overflow-hidden rounded-[26px] ${person.accent}`}
                      aria-hidden="true"
                    >
                      <div className="absolute inset-[10px] overflow-hidden rounded-[22px] bg-white/5">
                        <svg
                          viewBox="0 0 100 100"
                          className={`absolute inset-0 h-full w-full ${person.doodle}`}
                          fill="none"
                          aria-hidden="true"
                        >
                          <path d="M8 24C24 10 36 10 46 24C56 38 66 38 92 18" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M12 68C22 58 28 54 36 56C44 58 52 72 64 76C72 78 80 76 90 66" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        <img
                          src={person.image}
                          alt={person.name}
                          className="h-full w-full object-cover grayscale"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-[30px] border border-black/10 bg-[#F2ECE6] p-8 shadow-[0_4px_12px_rgba(15,18,22,0.06)]">
                    <p className="text-3xl font-semibold leading-none">{person.name}</p>
                    <p className="mt-2 text-2xl text-[#2D2F33]">{person.title}</p>
                    <p className="mt-8 text-lg leading-[1.45] text-[#32343A]">{person.quote}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
