"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "./SovereignRail.module.css";
// import { useTelemetry } from "../../providers/TelemetryProvider";

interface SovereignRailProps {
  children: React.ReactNode;
  railId: string;
}

export default function SovereignRail({ children, railId }: SovereignRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  // const { sendEvent } = useTelemetry(); 
  // Telemetry: IntersectionObserver eklenebilir.

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    
    // Elementi capture ediyoruz ki tarayıcının dışına çıklsa bile eventleri dinleyelim.
    scrollRef.current.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault(); // Metin seçimini engelle
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Drag hızı / friction
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }, [isDragging]);

  const handlePointerUpOrLeave = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    setIsDragging(false);
    scrollRef.current.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  return (
    <div className={styles.railWrapper} data-rail-id={railId}>
      <div 
        ref={scrollRef}
        className={`${styles.railContainer} ${isDragging ? styles.isDragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
      >
        {children}
      </div>
    </div>
  );
}
