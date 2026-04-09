import React from "react";
import { motion } from "framer-motion";
import type { BoardroomTherapistView } from "../boardroom.adapter";
import type { TherapistStressScore } from "../boardroom.intelligence";

type TherapistDeploymentProps = {
  title: string;
  subtitle: string;
  therapists: BoardroomTherapistView[];
  stressScores?: TherapistStressScore[];
};

function getStressMeta(score?: TherapistStressScore) {
  if (!score) {
    return {
      scoreClass: "text-white/24",
      badgeClass: "text-white/24 border-white/10",
      threadGlow: "",
    };
  }

  switch (score.band) {
    case "critical":
      return {
        scoreClass: "text-[#9F5A4A]",
        badgeClass: "text-[#9F5A4A] border-[#9F5A4A]/30",
        threadGlow: "shadow-[0_0_18px_rgba(159,90,74,0.28)]",
      };
    case "high":
      return {
        scoreClass: "text-[#C9912F]",
        badgeClass: "text-[#C9912F] border-[#C9912F]/30",
        threadGlow: "shadow-[0_0_18px_rgba(201,145,47,0.2)]",
      };
    case "moderate":
      return {
        scoreClass: "text-[#D4AF37]/90",
        badgeClass: "text-[#D4AF37]/90 border-[#D4AF37]/20",
        threadGlow: "shadow-[0_0_16px_rgba(212,175,55,0.16)]",
      };
    default:
      return {
        scoreClass: "text-[#A7B69A]",
        badgeClass: "text-[#A7B69A] border-[#A7B69A]/20",
        threadGlow: "",
      };
  }
}

export default function TherapistDeployment({
  title,
  subtitle,
  therapists,
  stressScores = [],
}: TherapistDeploymentProps) {
  const stressMap = new Map(stressScores.map((score) => [score.id, score]));

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

      <div className="space-y-2">
        <div className="hidden pb-4 text-[10px] uppercase tracking-[0.38em] text-white/22 lg:grid lg:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-5">
          <span>Therapist</span>
          <span>Ciro Marjı</span>
          <span>Kapasite</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {therapists.map((therapist, index) => {
            const stress = stressMap.get(therapist.id);
            const meta = getStressMeta(stress);

            return (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid grid-cols-1 gap-5 py-6 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:items-center"
              >
                <div className="space-y-2">
                  <div className="text-sm uppercase tracking-[0.3em] text-[#F5F1E8]/92">
                    {therapist.name}
                  </div>

                  {stress && (
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex border px-2.5 py-1 text-[10px] uppercase tracking-[0.26em] ${meta.badgeClass}`}
                      >
                        Stress {stress.stressScore}
                      </span>
                      <span className={`text-[10px] uppercase tracking-[0.24em] ${meta.scoreClass}`}>
                        {stress.band}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm uppercase tracking-[0.26em] text-[#A7B69A]">
                    {therapist.margin}
                  </div>
                  {stress?.interpretation && (
                    <div className="max-w-xs text-[10px] uppercase leading-5 tracking-[0.16em] text-white/24">
                      {stress.interpretation}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-[0.34em] text-white/26">
                      Capacity
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.34em] text-white/40">
                      {therapist.capacity}%
                    </span>
                  </div>

                  <div className="relative h-px w-full overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0, opacity: 0.2 }}
                      animate={{ width: `${therapist.capacity}%`, opacity: 1 }}
                      transition={{
                        duration: 1.6,
                        delay: index * 0.1 + 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`absolute inset-y-0 left-0 bg-[#D4AF37] ${meta.threadGlow}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
