import { createAppServer } from "./http.js";
const port = Number(process.env.PORT || 4310);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw Error("PORT must be between 1 and 65535.");
const server = createAppServer();
server.listen(port, "127.0.0.1", () =>
  console.log(`Artifact Plane: http://127.0.0.1:${port}`),
);
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
