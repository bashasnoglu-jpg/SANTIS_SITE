import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({
    logger: true
});

// Register CORS
app.register(cors, {
    origin: true // Allow all origins for dev
});

app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
