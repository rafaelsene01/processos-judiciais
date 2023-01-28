import { Fetch } from "@/util";

export const pjemg = async (req, res) => {
  try {
    const { headers: getHeaders } = await Fetch(
      "https://pje-consulta-publica.tjmg.jus.br/",
      {
        method: "GET",
      }
    );
    const { taxId } = req.params;
    const key = getHeaders["set-cookie"];

    const data = {
      AJAXREQUEST: "_viewRoot",
      "fPP:numProcesso-inputNumeroProcessoDecoration:numProcesso-inputNumeroProcesso:mascaraProcessoReferenciaRadio":
        "on",
      "fPP:j_id148:processoReferenciaInput": "",
      "fPP:dnp:nomeParte": "",
      "fPP:j_id166:nomeSocial": "",
      "fPP:j_id175:alcunha": "",
      "fPP:j_id184:nomeAdv": "",
      "fPP:j_id193:classeProcessualProcessoHidden": "",
      tipoMascaraDocumento: "on",
      "fPP:dpDec:documentoParte": taxId.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      ),
      "fPP:Decoration:numeroOAB": "",
      "fPP:Decoration:j_id228": "",
      "fPP:Decoration:estadoComboOAB":
        "org.jboss.seam.ui.NoSelectionConverter.noSelectionValue",
      fPP: "fPP",
      autoScroll: "",
      "javax.faces.ViewState": "j_id1",
      "fPP:j_id234": "fPP:j_id234",
      "AJAX:EVENTS_COUNT": 1,
    };

    const jsessionid = String(/JSESSIONID=(?:;?[^;]*;|^[^;]*$)/.exec(key))
      ?.split("")
      ?.slice(0, -1)
      ?.join("");

    const Cookie = `JSESSIONID=${jsessionid}; _ga=GA1.3.612563346.1674875149; _gid=GA1.3.1673122292.1674875149; BIGipServerpje_21_cons_pub=2233663498.64288.0000; TS5947a904027=086b196e5eab2000a847df80bc077d14bb917bf95d47c789c4bca6e5047680462735f0201ded4b7508aa968dbe113000b086f0e237b867951620d568dbbd3405ed80455164cc0c80c5908c8e6273d7c18d89e30c4440b247bbb2c173499727a6`;
    console.log(jsessionid);
    const { data: html, headers } = await Fetch(
      `https://pje-consulta-publica.tjmg.jus.br/pje/ConsultaPublica/listView.seam;jsessionid=${jsessionid}`,
      {
        method: "POST",
        headers: {
          Cookie: Cookie,
        },
      },
      data
    );
    res.status(200).send(html);
  } catch (error) {
    res.status(400).send({ message: "Erro ao buscar" });
  }
};
