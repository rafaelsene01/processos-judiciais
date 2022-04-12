import axios from "axios";
import * as cheerio from "cheerio";
import { QueueTaskProcessos } from "@/queues";

export async function workerProcessos({
  site,
  id,
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

    let response: any = { Id_Processo: id };

    const $ = await cheerio.load(html, null, false);

    const alerta = $(".area h2").text().trim();
    if (alerta && /Segredo/.test(alerta)) {
      response = { ...response, restricted: true };

      const numero = $("#divEditar div span:nth-of-type(1)").text();
      const area = $("#divEditar div span:nth-of-type(2)").text();

      if (numero) {
        response = { ...response, numero };
      }
      if (numero) {
        response = { ...response, area };
      }

      const serventiaKey = $(
        "#VisualizaDados:nth-of-type(3) div:nth-of-type(1)"
      ).text();
      const serventia = $(
        "#VisualizaDados:nth-of-type(3) div:nth-of-type(1)"
      ).text();
      if (/Serventia/i.test(serventiaKey) && serventia) {
        response = {
          ...response,
          serventia,
        };
      }

      const magistradoKey = $(
        "#VisualizaDados:nth-of-type(3) div:nth-of-type(2)"
      ).text();
      const magistrado = $(
        "#VisualizaDados:nth-of-type(3) span:nth-of-type(2)"
      ).text();
      if (/Magistrado/i.test(magistradoKey) && magistrado) {
        response = {
          ...response,
          magistrado,
        };
      }
      return response;
    }

    const numero = $("span#span_proc_numero").text().trim();
    if (numero) {
      // FIXME: Temos um problema que em numero vem como "0000000-00.0000.8.09.0000" em alguns processos
      response = { ...response, numero, page };
    }

    return response;
  } catch (_) {
    return { Id_Processo: id };
  }
}
