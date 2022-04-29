import { Fetch, $ } from "@/util";
import { QueueTaskPaginacao } from "@/queues";

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

    const processList: any = [];

    const nodes = $('//*[@id="tabListaProcesso"]/tr/@onclick', html);
    for (let i = 0; i < nodes.length; i++) {
      const attrs = nodes[i]?.value;
      if (attrs) {
        const id_match = attrs.match(/(\d+)/);
        if (id_match && id_match.length) {
          processList.push({ id: id_match[0], page: page });
        }
      }
    }

    return processList;
  } catch (_) {
    return [];
  }
}
