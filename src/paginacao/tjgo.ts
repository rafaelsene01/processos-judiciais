import * as cheerio from "cheerio";
import { queueProcessos, queuePaginacao } from "@/fila";
import { anticaptcha, _2Captcha } from "@/captcha";
import axios from "axios";

const delay = (time) => new Promise((res) => setTimeout(res, time));

const site = process.env.tjgo_site as string;

export const tjgo = async (req, res) => {
  try {
    const recaptcha = await anticaptcha(site, process.env.tjgo_key as string);

    const params = {
      PaginaAtual: "2",
      TituloPagina: "null",
      PassoBusca: "0",
      ServletRedirect: "null",
      "TituloDaPagina=Consulta": "Consulta+P%FAblica+de+Processos",
      ProcessoNumero: "",
      NomeParte: "",
      pesquisarNomeExato: "false",
      CpfCnpjParte: req.params.id,
      "g-recaptcha-response": recaptcha,
    };

    const { data: html, headers } = await axios.post(site, null, {
      params,
    });

    // TODO: NÃO FOI ENCONTRADO ITEMS
    {
      const $ = await cheerio.load(html, null, false);
      if (!$("#Paginacao").length) {
        res.status(200).send({
          message:
            "Nenhum Processo foi localizado para os parâmetros informados.",
        });
        return;
      }
    }
    // TODO: FIM, NÃO FOI ENCONTRADO ITEMS

    // TODO: PAGINAÇÃO
    const pageNumber = 0;
    let lastPageNumber = 0;
    const $ = await cheerio.load(html, null, false);
    $("#Paginacao a").each((_, el) => {
      const attrs = el.attribs.onclick;
      if (attrs) {
        lastPageNumber = Number(attrs.replace(/(buscaPublica)|[()]/g, ""));
      }
    });

    const processList: any = [];

    const cookie: any = headers["set-cookie"];

    for (let i = pageNumber; i <= lastPageNumber; i++) {
      queuePaginacao
        .push({
          site,
          recaptcha,
          page: i,
          cookie,
        })
        .then((data) => {
          data.forEach((item) => {
            if (item.message) {
              processList.push(item);
            } else {
              queueProcessos
                .push({
                  ...item,
                  site: process.env.tjgo_site as string,
                  cookie,
                  recaptcha,
                })
                .then((data) => {
                  processList.push(data);
                  console.log("Processos: ", processList.length);
                })
                .catch(() => console.log("Erro ao processar"));
            }
          });
        });
    }
    // TODO: FIM, PAGINAÇÃO

    await queuePaginacao.drained();
    await queueProcessos.drained();

    res.status(200).send({ total: processList.length, items: processList });
  } catch (error) {
    res.status(400).send({ message: "Erro ao buscar" });
  }
};
