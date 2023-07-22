import { queueProcessos, queuePaginacao } from "@/queues";
import { anticaptcha, _2Captcha } from "@/captcha";
import { Fetch } from "@/util";
import axios from "axios";
import { load } from "cheerio";

const site = process.env.tjgo_site as string;
const processList: any = [];

const _paginacao = async (page, recaptcha, cookie?) => {
  try {
    // Pegando a lista de processos da pagina
    const data = await queuePaginacao.push({
      site,
      recaptcha,
      page,
      cookie,
    });

    // console.log(page)

    // Buscar dados de cada processo listado
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

    // console.log(item.page, data.Id_Processo)
    processList.push(data);

    // FIXME: Remover isso depois
    // console.log("Processos: ", processList.length);
  } catch (error) {
    console.log("Erro ao processar");
  }
};

export const tjgo = async (req, res) => {
  try {
    // const recaptcha = await anticaptcha(site, process.env.tjgo_key as string);
    const { data } = await axios.get("http://localhost:4444/");
    const recaptcha = data.token;

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
    const $ = load(html || "");

    // TODO: NÃO FOI ENCONTRADO ITEMS
    {
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
    // Pegar quantidade de paginas
    $("#Paginacao")
      .find("a")
      .toArray()
      .map((element) => {
        const onclick = $(element).attr("onclick");
        if (onclick) {
          lastPageNumber = Number(onclick.replace(/(buscaPublica)|[()]/g, ""));
        }
      });

    // Jogar cada pagina para ser processada 
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
