import { defineRailway, github, postgres, preserve, project, ref, service, volume } from "railway/iac";

// Infrastruttura Railway di Tartalendario.
// I segreti (JWT_SECRET, ADMIN_PASSWORD) sono impostati dalla dashboard/CLI e qui solo preservati.
export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-west2" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-west2", sizeMB: 5000 });

  const tartalendario = service("tartalendario", {
    // checkSuites: il deploy attende che la GitHub Action "CI" sia verde.
    source: github("federicodipierro87-beep/tartalendario", { branch: "main", checkSuites: true }),
    rootDirectory: "/backend",
    build: { builder: "RAILPACK", buildCommand: "npm run build", watchPatterns: ["/backend/**"] },
    preDeploy: "npm run predeploy",
    start: "npm start",
    healthcheck: "/health",
    healthcheckTimeout: 120,
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 5 },
    replicas: { "us-west2": 1 },
    env: {
      DATABASE_URL: ref(Postgres, "DATABASE_URL"),
      JWT_SECRET: preserve(),
      CORS_ORIGIN: "http://localhost:5173",
      PUBLIC_API_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      ADMIN_EMAIL: "federico.dipierro87@gmail.com",
      ADMIN_PASSWORD: preserve(),
      ADMIN_NOME: "Federico",
    },
  });

  return project("charming-celebration", {
    resources: [Postgres, tartalendario, postgresVolume],
  });
});
