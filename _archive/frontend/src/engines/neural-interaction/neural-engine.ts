import { MotionAnalyzer } from "./motion-analyzer";
import { predictIntent, createIntentVector } from "./intent-model";
import { Fabric } from "../worker-fabric";

export class NeuralEngine {
    private analyzer: MotionAnalyzer;
    private isEnabled = false;

    constructor() {
        this.analyzer = new MotionAnalyzer();
    }

    public init() {
        if (this.isEnabled) return;
        this.isEnabled = true;

        console.log('🧠 [Neural Engine] Intent Inference Modülü Aktif.');

        window.addEventListener('pointermove', (e) => {
            // Screen space normalization for consistent math
            const normX = (e.clientX / window.innerWidth) * 2 - 1;
            const normY = -(e.clientY / window.innerHeight) * 2 + 1;

            const motion = this.analyzer.update(normX, normY);
            const intent = predictIntent(motion.vx, motion.vy, motion.ax, motion.ay);
            const vector = createIntentVector(motion.vx, motion.vy);

            this.reactToIntent(intent, vector);
        }, { passive: true });
    }

    private reactToIntent(intent: string, vector: { direction: { x: number, y: number }, energy: number }) {
        // High frequency direct-to-worker dispatch
        if (intent === "explore") {
            Fabric.Render.particleBurst(Math.min(vector.energy * 2, 5));
        } else if (intent === "navigate") {
            Fabric.Render.orbDistort(vector.direction.x, vector.direction.y);
        } else if (intent === "focus") {
            Fabric.Render.cameraFocus(true);
        } else if (intent === "idle") {
            Fabric.Render.cameraFocus(false);
        }
    }
}
