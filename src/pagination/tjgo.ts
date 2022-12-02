import { Fetch, $ } from "@/util";
import { QueueTaskPaginacao } from "@/queues";
import { load } from "cheerio";

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

    const { data: html } = await Fetch(
      site,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      },
      params
    );

    const $ = load(html || "");

    const processList: { id: string; page: number }[] = [];

    $("tbody#tabListaProcesso")
      .find("tr")
      .toArray()
      .map((element) => {
        const onclick = $(element).attr("onclick");
        if (onclick) {
          const id_match = onclick.match(/(\d+)/);
          if (id_match && id_match.length) {
            processList.push({ id: id_match[0], page });
          }
        }
      });

    return processList;
  } catch (_) {
    return [];
  }
}
