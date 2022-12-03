import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { getProcessTJGO } from "@/lawsuit";
import { nextText, findAllText, pole } from "@/util";
import { tjgoProcessos } from "./mock/tjgo";
require("util").inspect.defaultOptions.depth = null;

describe("TJGO - Validating process data", () => {
  const folder = "./src/html/tjgo/processos";
  const amountFiles = readdirSync(folder).length;
  for (let i = 0; i < amountFiles; i++) {
    it(`Checking if the tjgo/processos/${
      i + 1
    }.html data matches the mock`, () => {
      const html = readFileSync(resolve(`${folder}/${i + 1}.html`), "utf8");
      expect(getProcessTJGO(html)).toEqual(tjgoProcessos[i]);
    });
  }
});
// const $ = load(html);
