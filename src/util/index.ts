export * from "./apiCall";
import { load } from "cheerio";

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
