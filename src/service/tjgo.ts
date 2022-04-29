import { queueProcessos, queuePaginacao } from "@/queues";
import { anticaptcha, _2Captcha } from "@/captcha";
import { Fetch, $ } from "@/util";

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

    const { data: html, headers } = await Fetch(
      site,
      {
        method: "POST",
      },
      params
    );

    // TODO: NÃO FOI ENCONTRADO ITEMS
    {
      if (!$('//*[@id="Paginacao"]', html)) {
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
    const nodes = $('//*[@id="Paginacao"]/a/@onclick', html);
    console.log(nodes.length);
    const attrs = nodes[nodes.length - 1]?.value;
    if (attrs) {
      lastPageNumber = Number(attrs.replace(/(buscaPublica)|[()]/g, ""));
    }

    const processList: any = [];

    for (let i = pageNumber; i <= lastPageNumber; i++) {
      queuePaginacao
        .push({
          site,
          recaptcha,
          page: i,
          cookie: headers["set-cookie"],
        })
        .then((data) => {
          data.forEach((item) => {
            queueProcessos
              .push({
                ...item,
                site: process.env.tjgo_site as string,
                cookie: headers["set-cookie"],
                recaptcha,
              })
              .then((data) => {
                processList.push(data);
                // FIXME: Remover isso depois
                console.log("Processos: ", processList.length);
              })
              .catch(() => console.log("Erro ao processar"));
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
