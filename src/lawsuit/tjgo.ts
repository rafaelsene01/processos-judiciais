import { Fetch } from "@/util";
import * as cheerio from "cheerio";
import { $ } from "@/util";
import { QueueTaskProcessos } from "@/queues";
import { SelectedValue } from "xpath";

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

export const getProcessTJGO = async (html) => {
  let response: any = {};

  const $$ = await cheerio.load(html, null, false);

  const alerta = $$(".area h2").text().trim();
  if (alerta && /Segredo/.test(alerta)) {
    response = { ...response, restricted: true };

    const numero = $$("#divEditar div span:nth-of-type(1)").text();
    const area = $$("#divEditar div span:nth-of-type(2)").text();

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

  const numero = (
    $.text('//span[@id="span_proc_numero"]', html) as string
  ).trim();
  const area = (
    $.text('//*[@id="VisualizaDados"]/div[2]/span[2]', html) as string
  ).trim();
  const ativo: string[] = [];
  (
    $.xpath(
      '//*[@id="VisualizaDados"]/fieldset/span[1][contains(@class, "nomes")]',
      html
    ) as SelectedValue[]
  ).forEach((element: any) => {
    const text = element?.firstChild?.data?.trim();
    if (text) ativo.push(text);
  });
  const passivo: string[] = [];
  (
    $.xpath(
      '//*[@id="VisualizaDados"]/fieldset/span/span[contains(@class, "nomes")]',
      html
    ) as SelectedValue[]
  ).forEach((element: any) => {
    const text = element?.firstChild?.data?.trim();
    if (text) passivo.push(text);
  });

  const valorCausa = (
    $.text('//*[@id="VisualizaDados"]/span[4]', html) as string
  ).trim();
  const valorCondenacao = (
    $.text('//*[@id="VisualizaDados"]/span[5]', html) as string
  ).trim();
  const assunto = (
    $.text(
      '//*[@id="VisualizaDados"]/span[3]/table/tbody/tr/td',
      html
    ) as string
  ).trim();

  const movimantecoes: any[] = [];
  (
    $.xpath(
      '//*[@id="tabListaProcesso"]/tr[contains(@class, "TabelaLinha")]',
      html
    ) as SelectedValue[]
  ).forEach((element: any) => {
    const td: any = $.xpath("//td", element.toString());
    const span: any = $.xpath("//span", td.toString());
    const numero = td[0].firstChild?.data?.trim();
    const text = $.xpath("//text()[2]", td[1].toString()).toString().trim();
    const movimentacao = span[0].firstChild?.data?.trim();
    const data = td[2].firstChild?.data?.trim();
    const usuario = td[3].firstChild?.data?.trim();

    movimantecoes.push({
      numero,
      movimentacao: movimentacao
        ? `${movimentacao}. ${text}`.trim()
        : text.trim(),
      data,
      usuario,
    });
  });

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
