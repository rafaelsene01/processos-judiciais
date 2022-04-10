import axios from "axios";
import * as cheerio from "cheerio";
import { QueueTaskProcessos } from "@/fila";

export async function workerPaginacao({
  site,
  page,
  recaptcha,
  cookie,
}: QueueTaskProcessos) {
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
        const [attrs, attrs2] = onclick.split(":");
        let id = "";
        const id_match = attrs.match(/(\d+)/);
        if (id_match && id_match.length) {
          id = id_match[0];
        }
        let page = 0;
        const page_match = attrs2.match(/(\d+)/);
        if (page_match && page_match.length) {
          page = Number(page_match[0]);
        }

        const code = $(el).find("td").first().text().trim();

        if (/false/.test(onclick)) {
          const message = $(`#segredojus${id}`).text().trim();
          processList.push({ id, message });
        } else {
          processList.push({ id, code, page });
        }
      }
    });
    return processList;
  } catch (_) {
    return [];
  }
}

export async function workerProcessos({
  site,
  id,
  code,
  page,
  recaptcha,
  cookie,
}: QueueTaskProcessos) {
  try {
    const params = {
      PaginaAtual: -1,
      TipoConsulta: "null",
      PassoBusca: 2,
      ServletRedirect: "null",
      TituloDaPagina: "Consulta+P%FAblica+de+Processos",
      Id_Processo: id,
      PosicaoPagina: page + 1,
      "g-recaptcha-response": recaptcha,
    };
    const { data: html } = await axios.post(site, null, {
      headers: {
        Cookie: cookie,
      },
      params,
    });

    let response: any = { Code_Processo: code, Id_Processo: id };

    const $ = await cheerio.load(html, null, false);
    $("#span_proc_numero").each((_, el) => {
      response = { ...response, span_proc_numero: $(el).text().trim() };
    });
    return response;
  } catch (_) {
    return { Code_Processo: code, Id_Processo: id };
  }
}
