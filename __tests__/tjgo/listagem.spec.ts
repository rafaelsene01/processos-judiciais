import fs from "fs";
import path from "path";
import { getProcessTJGO } from "@/lawsuit";
import { nextText, findAllText, pole } from "@/util";
import { gProcessos } from "./gabarito";
require("util").inspect.defaultOptions.depth = null;

describe("TJGO", () => {
  const folder = "./src/html/tjgo/processos";
  const amountFiles = fs.readdirSync(folder).length;
  for (let i = 0; i < amountFiles; i++) {
    it(`Validando Processo - tjgo/processos/${i + 1}.html`, () => {
      const html = fs.readFileSync(
        path.resolve(`${folder}/${i + 1}.html`),
        "utf8"
      );
      expect(getProcessTJGO(html)).toEqual(gProcessos[i]);
    });
  }
});
// const $ = load(html);
