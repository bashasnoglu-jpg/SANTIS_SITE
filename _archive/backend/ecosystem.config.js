module.exports = {
  apps: [{
    name: "santis-sovereign-gateway",
    script: "./src/gateway.js",
    instances: "max", // Sovereign Multi-Core Scaling
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
      PORT: 8080
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8080
    }
  }]
};
