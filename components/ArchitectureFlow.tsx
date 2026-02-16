import React from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Globe,
    Cloud,
    Radio,
    Workflow,
    Database,
    Brain,
    Pause,
    Play,
} from 'lucide-react';

/* ─── node data ─── */
const NODES = [
    { id: 'web', label: 'Website / App', Icon: Globe, color: '#22C55E' },
    { id: 'aws', label: 'AWS (S3 + Lambda)', Icon: Cloud, color: '#F59E0B' },
    { id: 'kafka', label: 'Kafka', Icon: Radio, color: '#3B82F6' },
    { id: 'airflow', label: 'Airflow', Icon: Workflow, color: '#A855F7' },
    { id: 'postgres', label: 'PostgreSQL', Icon: Database, color: '#06B6D4' },
    { id: 'ai', label: 'AI / RAG Service', Icon: Brain, color: '#F43F5E' },
] as const;

/* ─── connection definitions (index pairs) ─── */
const CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
] as const;

/* ─── styles injected once ─── */
const flowStyles = `
@keyframes flowDash {
  to { stroke-dashoffset: -24; }
}
.arch-flow-path {
  stroke-dasharray: 8 8;
  animation: flowDash 1.2s linear infinite;
}
.arch-flow-path.paused,
.arch-flow-dot.paused {
  animation-play-state: paused !important;
}
`;

/* ─── helpers ─── */
const nodeCenter = (col: number, row: number, cardW: number, cardH: number, gapX: number, gapY: number) => {
    const x = col * (cardW + gapX) + cardW / 2;
    const y = row * (cardH + gapY) + cardH / 2;
    return { x, y };
};

/* ─── component ─── */
export const ArchitectureFlow: React.FC = () => {
    const sectionRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.25 });
    const [paused, setPaused] = React.useState(false);

    /* layout constants (desktop) */
    const CARD_W = 220;
    const CARD_H = 140;
    const GAP_X = 60;
    const GAP_Y = 60;
    const COLS = 3;

    const gridW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const gridH = 2 * CARD_H + GAP_Y;

    /* pre-compute node positions */
    const positions = NODES.map((_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return nodeCenter(col, row, CARD_W, CARD_H, GAP_X, GAP_Y);
    });

    /* build svg paths */
    const paths = CONNECTIONS.map(([from, to]) => {
        const a = positions[from];
        const b = positions[to];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        // gentle curve
        const cx = mx;
        const cy = a.y === b.y ? my - 30 : my;
        return {
            d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`,
            from,
            to,
            length: Math.hypot(b.x - a.x, b.y - a.y) * 1.15, // approximate arc length
        };
    });

    return (
        <div ref={sectionRef} className="mt-24 lg:mt-32">
            <style>{flowStyles}</style>

            {/* Header */}
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
            >
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22C55E]">
                    Architecture
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                    How Data Flows
                </h2>
                <p className="mt-3 mx-auto max-w-lg text-sm text-white/60">
                    From your first tap to personalised coaching — see how every piece of data moves through our stack.
                </p>
            </motion.div>

            {/* Pause / Play toggle */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={() => setPaused((p) => !p)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white"
                    aria-label={paused ? 'Resume animation' : 'Pause animation'}
                >
                    {paused ? <Play size={14} /> : <Pause size={14} />}
                    {paused ? 'Resume' : 'Pause'}
                </button>
            </div>

            {/* ─── Desktop grid ─── */}
            <div className="hidden lg:flex justify-center">
                <div className="relative" style={{ width: gridW, height: gridH }}>
                    {/* SVG layer */}
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        width={gridW}
                        height={gridH}
                        viewBox={`0 0 ${gridW} ${gridH}`}
                        fill="none"
                    >
                        {/* glow filter */}
                        <defs>
                            <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {paths.map((p, i) => (
                            <g key={i}>
                                {/* base stroke */}
                                <path
                                    d={p.d}
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                {/* animated dash */}
                                <path
                                    d={p.d}
                                    className={`arch-flow-path ${paused ? 'paused' : ''}`}
                                    stroke={NODES[p.to].color}
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    opacity={isInView ? 1 : 0}
                                    style={{ transition: 'opacity 0.4s' }}
                                />
                                {/* glowing dot */}
                                {isInView && (
                                    <motion.circle
                                        r="5"
                                        fill={NODES[p.to].color}
                                        filter="url(#dot-glow)"
                                        initial={{ offsetDistance: '0%' }}
                                        animate={paused ? {} : { offsetDistance: '100%' }}
                                        transition={{
                                            duration: 2.5 + i * 0.3,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                        style={{
                                            offsetPath: `path("${p.d}")`,
                                            offsetRotate: '0deg',
                                        }}
                                    />
                                )}
                            </g>
                        ))}
                    </svg>

                    {/* Node cards */}
                    {NODES.map((node, i) => {
                        const col = i % COLS;
                        const row = Math.floor(i / COLS);
                        const left = col * (CARD_W + GAP_X);
                        const top = row * (CARD_H + GAP_Y);
                        const Icon = node.Icon;

                        return (
                            <motion.div
                                key={node.id}
                                className="absolute flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#1A1A1A]/90 backdrop-blur-sm shadow-lg"
                                style={{
                                    width: CARD_W,
                                    height: CARD_H,
                                    left,
                                    top,
                                    boxShadow: `0 0 24px ${node.color}15, 0 4px 20px rgba(0,0,0,0.4)`,
                                }}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.15 * i }}
                            >
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-full mb-2"
                                    style={{ backgroundColor: `${node.color}20` }}
                                >
                                    <Icon size={20} style={{ color: node.color }} />
                                </div>
                                <p className="text-sm font-semibold text-white/90 text-center px-2 leading-tight">
                                    {node.label}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Mobile step list ─── */}
            <div className="flex flex-col items-center gap-0 lg:hidden px-4">
                {NODES.map((node, i) => {
                    const Icon = node.Icon;
                    return (
                        <React.Fragment key={node.id}>
                            <motion.div
                                className="flex items-center gap-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1A1A1A]/90 px-5 py-4 backdrop-blur-sm"
                                style={{
                                    boxShadow: `0 0 20px ${node.color}12`,
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.12 * i }}
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${node.color}20` }}
                                >
                                    <Icon size={18} style={{ color: node.color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/90">{node.label}</p>
                                    <p className="text-[11px] text-white/40">Step {i + 1}</p>
                                </div>
                            </motion.div>

                            {/* Animated connector between steps */}
                            {i < NODES.length - 1 && (
                                <div className="flex flex-col items-center py-1">
                                    <svg width="2" height="32" viewBox="0 0 2 32" fill="none">
                                        <line
                                            x1="1" y1="0" x2="1" y2="32"
                                            stroke={node.color}
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            className={`arch-flow-path ${paused ? 'paused' : ''}`}
                                            opacity="0.5"
                                        />
                                    </svg>
                                    <motion.div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: NODES[i + 1].color, boxShadow: `0 0 8px ${NODES[i + 1].color}` }}
                                        animate={paused ? {} : { scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
