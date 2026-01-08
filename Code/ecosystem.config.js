module.exports = {
  apps: [
    {
      name: "kaffettino-api-server", // Nome del processo in PM2
      script: "server.ts", // Il file da avviare
      cwd: "./backend/api/src/", // La cartella dove si trova questo server
      args: "run", // Argomenti da passare allo script
      interpreter: "/home/kirk/.bun/bin/bun", // Percorso assoluto di Bun (verifica con 'which bun')
    },
  ],
};
