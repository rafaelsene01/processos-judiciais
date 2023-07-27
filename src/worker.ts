import { workerData, parentPort } from 'worker_threads'
import fastq from "fastq";
import fetch, { RequestInit } from "node-fetch";
import { TextDecoder } from "util";
import { CookieJar } from 'tough-cookie';
import { load } from "cheerio";

const cookieJar = new CookieJar();

export const Fetch = async (url: string, request: RequestInit, params?) => {
  const cookies = await cookieJar.getCookies(url);
  const cookieHeader = cookies.map(cookie => cookie.cookieString()).join('; ');

  if (!request.headers) {
    request.headers = {};
  }

  request.headers["Cookie"] = cookieHeader;

  try {
    const response = params
      ? await fetch(
        Object.keys(params).reduce((newUrl, i) => {
          newUrl.searchParams.append(i, params[i]);
          return newUrl;
        }, new URL(url)),
        request
      )
      : await fetch(url,
        request
      );

    const setCookieHeaders = response.headers.raw()['set-cookie'];
    if (setCookieHeaders) {
      setCookieHeaders.forEach(cookie => {
        cookieJar.setCookieSync(cookie, url);
      });
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const data = decoder.decode(buffer);
    const meta = /charset=(?:"?[^"]*"|^[^"]*$)/.exec(data);

    if (meta) {
      const newDecoder = new TextDecoder(
        meta[0].replace("charset=", "").replace(/"/g, "")
      );
      const newData = newDecoder.decode(buffer);
      return { data: newData };
    }
    return { data };
  } catch (error) {
    return { error };
  }
};

export const nextText = (text, html) => {
  const $ = load(html);
  const element = $('*')
    .toArray()
    .find((el) => $(el).text().trim() === text);
  return $(element).next().text().replace("\n", "").replace(/\s+/g, " ").trim();
};

export const findAllText = (text, html) => {
  const $ = load(html);
  const values: string[] = [];
  $('*')
    .toArray()
    .forEach((element) => {
      if ($(element).text().trim() === text)
        values.push(
          $(element).next().text().replace("\n", "").replace(/\s+/g, " ").trim()
        );
    });
  return values;
};

export const findElementHTML = (selector, childTag, childText, html) => {
  const $ = load(html);
  const ElementHTML = $(selector)
    .toArray()
    .find((element) => {
      const reg = RegExp(childText, "i");
      return reg.test($(element).find(childTag)?.first()?.text());
    });

  return $(ElementHTML).html();
};

export const getTable = (selector, keys, html) => {
  const $ = load(html);
  return $(selector)
    .toArray()
    .map((element) => {
      const td = $(element)
        .find("td")
        .toArray()
        .map((el, i) => {
          if (i !== 1)
            return $(el).text().replace("\n", "").replace(/\s+/g, " ").trim();
          const title = $(el)
            .find("span")
            .text()
            .replace("\n", "")
            .replace(/\s+/g, " ")
            .trim();
          const description = $(el)
            .text()
            .replace("\n", "")
            .replace(/\s+/g, " ")
            .replace(title, "")
            .trim();
          return { title, description };
        });
      return td.reduce(
        (item, text, i) => (keys[i] ? { ...item, [keys[i]]: text } : item),
        {}
      );
    });
};

export const pole = (text, html) => {
  return findElementHTML("fieldset.VisualizaDados", "legend", text, html);
};

export const getProcessTJGO = (html) => {
  let response = {};

  const $$ = load(html, null, false);

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

export const workerTJGO = async ({
  site,
  id,
  page,
  recaptcha,
}) => {
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

    const response = await getProcessTJGO(html);
    // TODO: Esse page que passo nao e necessario para Objeto final
    return { Id_Processo: id, page: page + 1, ...response };
  } catch (_) {
    console.log(`\x1b[31m${JSON.stringify({ Id_Processo: id, page: page + 1 }, null, 4)}\x1b[0m`);
    return { Id_Processo: id, page: page + 1 };
  }
};

const queueProcessos =
  fastq.promise(workerTJGO, 15);

async function processData({ item, recaptcha, headers, url }) {
  const processList: any = [];

  if (headers) {
    headers.forEach(cookie => {
      cookieJar.setCookieSync(cookie, url);
    });
  }

  const _processos = async (i, recaptcha) => {
    const data = await queueProcessos.push({
      ...i,
      site: process.env.tjgo_site as string,
      recaptcha,
    });

    processList.push(data);
  }

  item.forEach(i => {
    _processos(i, recaptcha)
  })

  await queueProcessos.drained();

  return processList
}

// Recebe os dados enviados pelo servidor na Worker Thread e envia o resultado de volta
processData(workerData)
  .then((result) => parentPort.postMessage(result))
  .catch((error) => console.error(error));