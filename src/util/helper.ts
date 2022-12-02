import { load } from "cheerio";

export const nextText = (text, tag, html) => {
  const $ = load(html);
  const element = $(tag)
    .toArray()
    .find((el) => $(el).text().trim() === text);
  return $(element).next().text().trim();
};

export const findAllText = (text, tag, html) => {
  const $ = load(html);
  const values: string[] = [];
  $(tag)
    .toArray()
    .forEach((element) => {
      if ($(element).text().trim() === text)
        values.push($(element).next().text().trim());
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
        .map((el) => $(el).text().trim());
      return td.reduce(
        (item, text, i) => (keys[i] ? { ...item, [keys[i]]: text } : item),
        {}
      );
    });
};

export const pole = (text, html) => {
  return findElementHTML("fieldset.VisualizaDados", "legend", text, html);
};
