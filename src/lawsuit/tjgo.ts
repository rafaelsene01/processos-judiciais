import { Fetch, findAllText, findElementHTML, getTable, pole } from "@/util";
import * as cheerio from "cheerio";
import { nextText } from "@/util";
import { QueueTaskProcessos } from "@/queues";

export const workerTJGO = async ({
  site,
  id,
  page,
  recaptcha,
  cookie,
}: QueueTaskProcessos) => {
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
    const { data: html } = await Fetch(
      site,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
        },
      },
      params
    );

    const response = await getProcessTJGO(html);
    // TODO: Esse page que passo n]ao e necessario para Objeto final
    return { Id_Processo: id, page: page + 1, ...response };
  } catch (_) {
    return { Id_Processo: id, page: page + 1 };
  }
};

export const getProcessTJGO = (html) => {
  let response = {};

  const $$ = cheerio.load(html, null, false);

  const alerta = $$(".area h2").text().trim();
  if (alerta && /Segredo/.test(alerta)) {
    response = { ...response, restricted: true };

    const numero = nextText("Número", "div", $$(".aEsquerda").html());
    const area = nextText("Área", "div", $$(".aEsquerda").html());

    if (numero) {
      response = { ...response, numero };
    }
    if (numero) {
      response = { ...response, area };
    }

    const serventiaKey = $$(
      "#VisualizaDados:nth-of-type(3) div:nth-of-type(1)"
    ).text();
    const serventia = $$(
      "#VisualizaDados:nth-of-type(3) div:nth-of-type(1)"
    ).text();
    if (/Serventia/i.test(serventiaKey) && serventia) {
      response = {
        ...response,
        serventia,
      };
    }

    const magistradoKey = $$(
      "#VisualizaDados:nth-of-type(3) div:nth-of-type(2)"
    ).text();
    const magistrado = $$(
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

  const numero = nextText("Número", "div", $$(".aEsquerda").html());
  const area = nextText("Área", "div", $$(".aEsquerda").html());

  const ativo = findAllText("Nome", "div", pole("Polo Ativo", html));
  const passivo = findAllText("Nome", "div", pole("Polo Passivo", html));

  const outros = findElementHTML(
    "fieldset.VisualizaDados",
    "legend",
    "Outras Informações",
    html
  );

  const valorCausa = nextText("Valor da Causa", "div", outros);
  const valorCondenacao = nextText("Valor Condenação", "div", outros);
  const assunto = nextText("Assunto(s)", "div", outros);

  const movimantecoes = getTable(
    "table tbody tr.filtro-entrada",
    ["numero", "movimentacao", "data", "usuario"],
    $$("#abas").html()
  );

  if (numero) {
    response = {
      ...response,
      numero,
      area,
      ativo,
      passivo,
      valorCausa,
      valorCondenacao,
      assunto,
      movimantecoes,
    };
  }

  return response;
};
