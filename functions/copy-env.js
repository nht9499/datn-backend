const fs = require("fs");
const args = process.argv.slice(2);
const possibleEnvList = ["local", "stag", "prod"];
const isValidEnv = (env) => possibleEnvList.includes(env);
const env = args[0];
if (!env) {
  throw new Error("Please specify an environment");
}
if (isValidEnv(env)) {
  if (!fs.existsSync(`./.env.${env}`)) {
    throw new Error(`Env file for ${env} does not exist`);
  }
  console.info(`Copying env file for ${env}`);
  try {
    fs.copyFileSync(`.env.${env}`, ".env");
  } catch (error) {
    console.log("error:", error);
    throw new Error(`Error when copying env file for "${env}": ${error}`);
  }
} else {
  throw new Error(`Invalid environment: ${env}`);
}
