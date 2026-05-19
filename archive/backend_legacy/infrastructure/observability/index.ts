import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

// SANTIS OS - THE GOD'S EYE (PHASE 32)
// Sovereign Observability Stack deployed via Pulumi

const stack = pulumi.getStack();

// 1. Otonom Ağ (Network)
const telemetryNetwork = new docker.Network("santis-telemetry-net", {
    name: `santis-telemetry-${stack}`,
    driver: "bridge",
});

// 2. OpenObserve (Veri Gölü & Log Yönetimi)
const openobserve = new docker.Container("openobserve-core", {
    image: "public.ecr.aws/zinclabs/openobserve:latest",
    name: `openobserve-${stack}`,
    networksAdvanced: [{ name: telemetryNetwork.name }],
    ports: [{ internal: 5080, external: 5080 }],
    envs: [
        "ZO_ROOT_USER_EMAIL=architect@santis.os",
        "ZO_ROOT_USER_PASSWORD=SovereignGodsEye2026!",
        "ZO_DATA_DIR=/data",
    ],
    volumes: [{ hostPath: "./oo-data", containerPath: "/data" }]
});

// 3. OTLP Collector (OpenTelemetry)
const otelCollector = new docker.Container("otel-collector", {
    image: "otel/opentelemetry-collector-contrib:latest",
    name: `otel-collector-${stack}`,
    networksAdvanced: [{ name: telemetryNetwork.name }],
    ports: [
        { internal: 4317, external: 4317 }, // OTLP gRPC
        { internal: 4318, external: 4318 }, // OTLP HTTP
    ],
    volumes: [{
        hostPath: "./otel-config.yaml",
        containerPath: "/etc/otelcol-contrib/config.yaml"
    }]
});

// 4. Fluent Bit (Edge Süzgeci - Kardinalite Yönetimi)
const fluentBit = new docker.Container("fluent-bit-edge", {
    image: "cr.fluentbit.io/fluent/fluent-bit:latest",
    name: `fluent-bit-edge-${stack}`,
    networksAdvanced: [{ name: telemetryNetwork.name }],
    ports: [
        { internal: 24224, external: 24224 }, // Forward
        { internal: 2020, external: 2020 }    // Health/Metrics
    ],
    volumes: [{
        hostPath: "./fluent-bit.conf",
        containerPath: "/fluent-bit/etc/fluent-bit.conf"
    }]
});

export const openObserveEndpoint = pulumi.interpolate`http://localhost:5080`;
export const otlpEndpoint = pulumi.interpolate`grpc://localhost:4317`;
