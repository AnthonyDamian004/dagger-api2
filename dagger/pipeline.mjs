import { connect } from "@dagger.io/dagger";

async function main() {
  await connect(
    async (client) => {
      const src = client.host().directory(".", {
        exclude: ["node_modules", "dagger", ".git"]
      });

      // Usar un contenedor base remoto SIN Docker local
      const app = client
        .container()
        .from("node:22")
        .withDirectory("/app", src)
        .withWorkdir("/app")
        .withEnvVariable("PORT", "8080")
        .withExec(["npm", "install"])
        .withExec(["npm", "start"]);

      const tester = client
        .container()
        .from("curlimages/curl:8.10.1")
        .withServiceBinding("app", app)
        .withExec(["sh", "-c", "sleep 5 && curl -s http://app:8080/health"]);

      const output = await tester.stdout();
      console.log("SALIDA DEL PIPELINE:");
      console.log(output);
    },
    // 🔥 IMPORTANTE: usar engine en la nube
    {
      logOutput: process.stderr,
      runnerHost: "https://engine.dagger.io" 
    }
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
