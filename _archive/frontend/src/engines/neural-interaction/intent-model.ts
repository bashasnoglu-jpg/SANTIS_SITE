export type IntentType = "explore" | "focus" | "navigate" | "idle";

export function predictIntent(vx: number, vy: number, ax: number, ay: number): IntentType {
    const speed = Math.sqrt(vx * vx + vy * vy);
    const accel = Math.sqrt(ax * ax + ay * ay);

    // Kriter 1: Hızlı hareket ve ivmelenme (Enerjik keşif)
    if (speed > 0.8 && accel > 0.4) {
        return "explore";
    }

    // Kriter 2: Yavaş ve sabit hareket (İnceleme / Odaklanma)
    if (speed > 0 && speed < 0.15) {
        return "focus";
    }

    // Kriter 3: Sabit hızlı doğrusal hareket (Menülere yönelme)
    if (speed >= 0.15 && speed <= 0.8 && accel < 0.2) {
        return "navigate";
    }

    return "idle";
}

export function createIntentVector(vx: number, vy: number) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    return {
        direction: { x: vx, y: vy },
        energy: magnitude
    };
}
