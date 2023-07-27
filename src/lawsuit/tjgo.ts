import { Fetch, findAllText, findElementHTML, getTable, pole } from "@/util";
import * as cheerio from "cheerio";
import { nextText } from "@/util";
import { QueueTaskProcessos, queueProcessosHTML } from "@/queues";
import { promises as fs } from "fs"

async function listarArquivosDoDiretorio(diretorio, arquivos?) {
  if (!arquivos)
    arquivos = [];
  const listaDeArquivos = await fs.readdir(diretorio);
  for (const k in listaDeArquivos) {
    const stat = await fs.stat(diretorio + '/' + listaDeArquivos[k]);
    if (stat.isDirectory())
      await listarArquivosDoDiretorio(diretorio + '/' + listaDeArquivos[k], arquivos);
    else
      arquivos.push(diretorio + '/' + listaDeArquivos[k]);
  }
  return arquivos;
}

export const workerTJGO = async ({
  site,
  id,
  page,
  recaptcha,
}: QueueTaskProcessos) => {
  let htmlError
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
      },
      params
    );
    htmlError = html

    const response = await getProcessTJGO(html);
    // TODO: Esse page que passo nao e necessario para Objeto final
    return { Id_Processo: id, page: page + 1, ...response };
  } catch (_) {
    queueProcessosHTML.push({ html: htmlError, dir: './src/html/tjgo/processos' })
    console.log(`\x1b[31m${JSON.stringify({ Id_Processo: id, page: page + 1 }, null, 4)}\x1b[0m`);
    return { Id_Processo: id, page: page + 1 };
  }
};

export const getProcessTJGO = (html) => {
  let response = {};

  const $$ = cheerio.load(html, null, false);

  const alerta = $$(".area h2").text().trim();
  if (alerta && /Segredo/.test(alerta)) {
    response = { ...response, restricted: true };

    const processNumber = nextText("Número", $$(".aEsquerda").html());
    const area = nextText("Área", $$(".aEsquerda").html());

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

  const processNumber = nextText("Número", $$(".aEsquerda").html());
  if (processNumber === "0000000-00.0000.8.09.0000") {
    throw Error("Dados inconsistente");
  }
  const area = nextText("Área", $$(".aEsquerda").html());

  const activePole = findAllText("Nome", pole("Polo Ativo", html));
  const activePassivo = findAllText("Nome", pole("Polo Passivo", html));

  const others = findElementHTML(
    "fieldset.VisualizaDados",
    "legend",
    "Outras Informações",
    html
  );

  const trialCourt = nextText("Serventia", others);
  const processClass = nextText("Classe", others);
  const subject = nextText("Assunto(s)", others);
  const causeValue = nextText("Valor da Causa", others);
  const condemnationValue = nextText("Valor Condenação", others);
  const originates = nextText("Processo Originário", others);
  const proceduralStage = nextText("Fase Processual", others);
  const distributionDate = nextText("Dt. Distribuição", others);
  const confidentiality = nextText("Segredo de Justiça", others);
  const status = nextText("Status", others);

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

export const workerHTML = async ({
  dir,
  html
}) => {
  const arquivos = await listarArquivosDoDiretorio(dir);
  const ultimoProcesso = arquivos.reduce((value, file) => {
    const splitFile = file.split("/")
    const fileName = splitFile[splitFile.length - 1].replace(".html", "")
    if (Number(fileName) > value) return Number(fileName)
    return value
  }, 1)
  await fs.writeFile(`${dir}/${ultimoProcesso + 1}.html`, html)
}
