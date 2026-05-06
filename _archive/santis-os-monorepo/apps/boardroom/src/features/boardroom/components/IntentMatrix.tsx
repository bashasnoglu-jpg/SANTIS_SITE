import React from "react";
import { motion } from "framer-motion";
import { Droplets, HeartPulse, Sparkles, Users, TrendingDown, Minus, TrendingUp } from "lucide-react";
import type { BoardroomIntentView } from "../boardroom.adapter";
import type { IntentGravityScore } from "../boardroom.intelligence";

type IntentMatrixProps = {
  title: string;
  subtitle: string;
  intents: BoardroomIntentView[];
  gravityScores?: IntentGravityScore[];
};

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Deep Recovery": HeartPulse,
  "Sensory Awakening": Sparkles,
  Detox: Droplets,
  "Couples Sanctuary": Users,
};

function getGravityMeta(score?: IntentGravityScore) {
  if (!score) {
    return {
      glowClass: "",
      scoreClass: "text-white/32",
      bandClass: "text-white/24",
    };
  }

  switch (score.band) {
    case "critical":
      return {
        glowClass: "shadow-[0_0_28px_rgba(212,175,55,0.18)]",
        scoreClass: "text-[#D4AF37]",
        bandClass: "text-[#D4AF37]/80",
      };
    case "high":
      return {
        glowClass: "shadow-[0_0_18px_rgba(212,175,55,0.12)]",
        scoreClass: "text-[#D4AF37]/90",
        bandClass: "text-[#D4AF37]/70",
      };
    case "moderate":
      return {
        glowClass: "",
        scoreClass: "text-[#C9912F]",
        bandClass: "text-[#C9912F]/80",
      };
    default:
      return {
        glowClass: "",
        scoreClass: "text-white/36",
        bandClass: "text-white/24",
      };
  }
}

function MomentumIcon({ momentum }: { momentum?: IntentGravityScore["momentum"] }) {
  if (momentum === "rising") {
    return <TrendingUp className="h-3.5 w-3.5 text-[#A7B69A]" strokeWidth={1.5} />;
  }
  if (momentum === "falling") {
    return <TrendingDown className="h-3.5 w-3.5 text-[#9F5A4A]" strokeWidth={1.5} />;
  }
  return <Minus className="h-3.5 w-3.5 text-white/28" strokeWidth={1.5} />;
}

export default function IntentMatrix({
  title,
  subtitle,
  intents,
  gravityScores = [],
}: IntentMatrixProps) {
  const scoreMap = new Map(gravityScores.map((score) => [score.id, score]));

  return (
    <section className="space-y-12">
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.44em] text-white/26">
          {title}
        </div>
        <h2 className="text-2xl font-light tracking-[0.08em] text-[#F5F1E8] sm:text-3xl">
          {subtitle}
        </h2>
      </div>

      <div className="space-y-10">
        {intents.map((intent, index) => {
          const Icon = iconMap[intent.label] ?? Sparkles;
          const gravity = scoreMap.get(intent.id);
          const meta = getGravityMeta(gravity);

          return (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-start gap-4">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/85" strokeWidth={1.5} />
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="truncate text-sm uppercase tracking-[0.28em] text-[#F5F1E8]/88">
                        {intent.label}
                      </span>
                      <MomentumIcon momentum={gravity?.momentum} />
                    </div>

                    {gravity && (
                      <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.28em]">
                        <span className={meta.scoreClass}>
                          Gravity {gravity.score}
                        </span>
                        <span className={meta.bandClass}>
                          {gravity.band}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-xs tracking-[0.28em] text-white/32">
                  {intent.value}%
                </span>
              </div>

              <div className="relative h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0, opacity: 0.3 }}
                  animate={{ width: `${intent.value}%`, opacity: 1 }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.12 + 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`absolute inset-y-0 left-0 bg-[#D4AF37] ${meta.glowClass}`}
                />
              </div>

              {gravity?.interpretation && (
                <p className="max-w-2xl text-[11px] uppercase leading-6 tracking-[0.18em] text-white/28">
                  {gravity.interpretation}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
