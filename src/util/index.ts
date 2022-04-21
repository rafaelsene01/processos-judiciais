import xpath from "xpath";
import { DOMParser } from "xmldom";

export * from "./apiCall";

export const $ = (x, html): xpath.SelectedValue[] | string => {
  const doc = new DOMParser({ errorHandler: {} }).parseFromString(html);
  return xpath.select(x, doc);
};
