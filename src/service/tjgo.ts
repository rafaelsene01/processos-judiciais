import { queuePaginacao } from "@/queues";
import { anticaptcha, _2Captcha } from "@/captcha";
import { getCaptchaToken, Fetch } from "@/util";
import { load } from "cheerio";

const site = process.env.tjgo_site as string;

export const tjgo = async (req, res) => {
  try {
    // const recaptcha = await anticaptcha(site, process.env.tjgo_key as string);
    const recaptcha = await getCaptchaToken()

    const processList: any = [];

    const _paginacao = async (page, recaptcha, headers, url) => {
      try {
        // Pegando a lista de processos da pagina
        const { data } = await queuePaginacao.push({
          site,
          recaptcha,
          page, headers, url
        });

        console.log(page, data.length)
        data.forEach(i => {
          processList.push(i)
        })

      } catch (error) {
        console.log("Erro na listagem");
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

    const { data: html, headers, url } = await Fetch(
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
      _paginacao(i, recaptcha, headers, url);
    }
    // TODO: FIM, PAGINAÇÃO

    await queuePaginacao.drained();

    res.status(200).send({ total: processList.length, error: processList.filter(i => !i.processNumber).length, items: processList });
  } catch (error) {
    res.status(400).send({ message: "Erro ao buscar" });
  }
};
