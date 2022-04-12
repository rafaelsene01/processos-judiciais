import axios from "axios";
import * as cheerio from "cheerio";
import { QueueTaskPaginacao } from "@/fila";

export async function workerPaginacao({
  site,
  page,
  recaptcha,
  cookie,
}: QueueTaskPaginacao) {
  try {
    const params = {
      PaginaAtual: 2,
      PosicaoPaginaAtual: page,
      PassoBusca: 2,
      TipoConsulta: "null",
      ServletRedirect: "null",
      "g-recaptcha-response": recaptcha,
    };

    const { data: html } = await axios.get(site, {
      headers: {
        Cookie: cookie,
      },
      params,
    });

    const processList: any = [];

    const $ = await cheerio.load(html, null, false);

    $("#tabListaProcesso tr.TabelaLinha2").each((_, el) => {
      const onclick = el.attribs.onclick;
      if (onclick) {
        let id = "";
        const id_match = onclick.match(/(\d+)/);
        if (id_match && id_match.length) {
          id = id_match[0];
        }

        processList.push({ id, page: page });
      }
    });
    return processList;
  } catch (_) {
    return [];
  }
}
