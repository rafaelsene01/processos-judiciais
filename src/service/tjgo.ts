import { queueProcessos, queuePaginacao } from "@/queues";
import { anticaptcha, _2Captcha } from "@/captcha";
import { getCaptchaToken, Fetch } from "@/util";
import { load } from "cheerio";

const site = process.env.tjgo_site as string;

export const tjgo = async (req, res) => {
  try {
    // const recaptcha = await anticaptcha(site, process.env.tjgo_key as string);
    const recaptcha = await getCaptchaToken()

    const pageList: any = [];
    const processList: any = [];

    const _paginacao = async (page, recaptcha) => {
      try {
        // Pegando a lista de processos da pagina
        const data = await queuePaginacao.push({
          site,
          recaptcha,
          page,
        });

        console.log("Pagina: ", page, "Processos: ", data.length)

        // Guardando as paginas
        data.forEach((item) => {
          pageList.push(item)
        });
      } catch (error) {
        console.log("Erro na listagem");
      }
    };

    const _processos = async (item, recaptcha) => {
      // item => id/page
      try {
        const data = await queueProcessos.push({
          ...item,
          site: process.env.tjgo_site as string,
          recaptcha,
        });

        processList.push(data);

        // FIXME: Remover isso depois
        console.log("Processo: ", { id: item.id, page: item.page }, ' | Total: ', processList.length,);
      } catch (error) {
        console.log("Erro ao processar");
      }
    };

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

    const { data: html, } = await Fetch(
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
      _paginacao(i, recaptcha);
    }
    // TODO: FIM, PAGINAÇÃO

    await queuePaginacao.drained();

    pageList.forEach((item) => {
      _processos(item, recaptcha)
    });

    await queueProcessos.drained();

    res.status(200).send({ total: processList.length, error: processList.filter(i => !i.processNumber).length, items: processList });
  } catch (error) {
    res.status(400).send({ message: "Erro ao buscar" });
  }
};
