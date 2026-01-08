module.exports = {
  apps: [
    {
      name: "kaffettino-api-server", // Nome del processo in PM2
      script: "server.ts", // Il file da avviare
      cwd: "./backend/api/", // La cartella dove si trova questo server
      interpreter: "/home/kirk/.bun/bin/bun", // Percorso assoluto di Bun (verifica con 'which bun')
      env: {
        PORT: 6969,
      },
    },
  ],
};
