import "./util/module-alias";
import "dotenv/config";
import express from "express";
import { tjgo } from "@/service";

const app = express();

// TODO: Não deixa o projeto rodar caso não tenham passado as envkey
const env = ["_2captcha", "anticaptcha", "tjgo_site", "tjgo_key"];
const keysError: string[] = [];
env.forEach((key) => {
  if (!process.env[key]) keysError.push(key);
});
if (keysError.length > 0) {
  throw new Error(`Esta falando envkey ${keysError.join(", ")}`);
}
// TODO: FIM

app.use(express.json());

app.get("/", (_, res) => {
  res.send("É necessario passar o CPF na rota -> /${CPF}");
});

app.get("/:id", tjgo);

// import fs from "fs";
// import path from "path";
// import { getProcessTJGO } from "@/lawsuit";
// import { $ } from "@/util";
// const html = fs.readFileSync(
//   path.resolve(__dirname, "html/tjgo/list.html"),
//   "utf8"
// );

// app.get("/:id", async (_, res) => {
//   const nodes = $.findOne('//*[@id="divEditar"]/fieldset/legend', html);
//   // const response = await getProcessTJGO(html);
//   console.log(nodes);
//   res.send(nodes.text);
// });

const normalizaPort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port = normalizaPort(process.env.PORT || "3334");

app.listen(port, () => {
  console.log(`app listening on http://localhost:${port}/`);
});
