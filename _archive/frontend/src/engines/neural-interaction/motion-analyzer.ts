export class MotionAnalyzer {
    private lastX = 0;
    private lastY = 0;
    private lastTime = performance.now();

    public vx = 0;
    public vy = 0;
    public ax = 0;
    public ay = 0;

    public update(x: number, y: number) {
        const now = performance.now();
        // Prevent division by zero
        const dt = Math.max(now - this.lastTime, 1); 

        const newVX = (x - this.lastX) / dt;
        const newVY = (y - this.lastY) / dt;

        this.ax = (newVX - this.vx) / dt;
        this.ay = (newVY - this.vy) / dt;

        this.vx = newVX;
        this.vy = newVY;

        this.lastX = x;
        this.lastY = y;
        this.lastTime = now;

        return {
            vx: this.vx,
            vy: this.vy,
            ax: this.ax,
            ay: this.ay
        };
    }
}
