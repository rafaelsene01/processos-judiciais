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
    console.log({ Id_Processo: id, page: page + 1 });
    return { Id_Processo: id, page: page + 1 };
  }
};

export const getProcessTJGO = (html) => {
  let response = {};

  const $$ = cheerio.load(html, null, false);

  const alerta = $$(".area h2").text().trim();
  if (alerta && /Segredo/.test(alerta)) {
    response = { ...response, restricted: true };

    const processNumber = nextText("Número", "div", $$(".aEsquerda").html());
    const area = nextText("Área", "div", $$(".aEsquerda").html());

    if (processNumber) {
      response = { ...response, processNumber };
    }
    if (processNumber) {
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

  const processNumber = nextText("Número", "div", $$(".aEsquerda").html());
  if (processNumber === "0000000-00.0000.8.09.0000") {
    throw Error("Dados inconsistente");
  }
  const area = nextText("Área", "div", $$(".aEsquerda").html());

  const activePole = findAllText("Nome", "div", pole("Polo Ativo", html));
  const activePassivo = findAllText("Nome", "div", pole("Polo Passivo", html));

  const others = findElementHTML(
    "fieldset.VisualizaDados",
    "legend",
    "Outras Informações",
    html
  );

  const trialCourt = nextText("Serventia", "div", others);
  const processClass = nextText("Classe", "div", others);
  const subject = nextText("Assunto(s)", "div", others);
  const causeValue = nextText("Valor da Causa", "div", others);
  const condemnationValue = nextText("Valor Condenação", "div", others);
  const originates = nextText("Processo Originário", "div", others);
  const proceduralStage = nextText("Fase Processual", "div", others);
  const distributionDate = nextText("Dt. Distribuição", "div", others);
  const confidentiality = nextText("Segredo de Justiça", "div", others);
  const status = nextText("Status", "div", others);

  const movements = getTable(
    "table tbody tr.filtro-entrada",
    ["numero", "movimentacao", "data", "usuario"],
    $$("#abas").html()
  );

  if (processNumber) {
    response = {
      ...response,
      processNumber,
      area,
      activePole,
      activePassivo,
      trialCourt,
      processClass,
      subject,
      causeValue,
      condemnationValue,
      originates,
      proceduralStage,
      distributionDate,
      confidentiality,
      status,
      movements,
    };
  }

  return response;
};
