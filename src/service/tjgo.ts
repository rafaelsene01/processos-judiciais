import { queueProcessos, queuePaginacao } from "@/queues";
import { anticaptcha, _2Captcha } from "@/captcha";
import { Fetch, $ } from "@/util";
import axios from "axios";

const site = process.env.tjgo_site as string;
const processList: any = [];

const _paginacao = async (page, recaptcha, cookie?) => {
  try {
    const data = await queuePaginacao.push({
      site,
      recaptcha,
      page,
      cookie,
    });

    data.forEach((item) => {
      _processos(item, recaptcha, cookie);
    });
  } catch (error) {
    console.log("Erro na listagem");
  }
};
const _processos = async (item, recaptcha, cookie?) => {
  try {
    const data = await queueProcessos.push({
      ...item,
      site: process.env.tjgo_site as string,
      cookie,
      recaptcha,
    });

    processList.push(data);

    // FIXME: Remover isso depois
    console.log("Processos: ", processList.length);
  } catch (error) {
    console.log("Erro ao processar");
  }
};

export const tjgo = async (req, res) => {
  try {
    // const recaptcha = await anticaptcha(site, process.env.tjgo_key as string);
    const { data } = await axios.post("http://localhost:3333/recaptcha", {
      version: 3,
      site_key: "",
    });
    const recaptcha = data.token.trim();

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

    const { data: html, headers } = await Fetch(
      site,
      {
        method: "POST",
      },
      params
    );
    // TODO: NÃO FOI ENCONTRADO ITEMS
    {
      if (!$.xpath('//*[@id="Paginacao"]', html)) {
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
    const nodes = $.xpath('//*[@id="Paginacao"]/a/@onclick', html);
    const attrs = nodes[nodes.length - 1]?.value;
    if (attrs) {
      lastPageNumber = Number(attrs.replace(/(buscaPublica)|[()]/g, ""));
    }

    for (let i = pageNumber; i <= lastPageNumber; i++) {
      _paginacao(i, recaptcha, headers["set-cookie"]);
    }
    // TODO: FIM, PAGINAÇÃO

    await queuePaginacao.drained();
    await queueProcessos.drained();

    res.status(200).send({ total: processList.length, items: processList });
  } catch (error) {
    res.status(400).send({ message: "Erro ao buscar" });
  }
};
