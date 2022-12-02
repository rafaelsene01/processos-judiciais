import Xpath, { SelectedValue } from "xpath";
import { DOMParser } from "xmldom";
export * from "./apiCall";
export * from "./helper";

type XpathType = {
  html: string;
  text: string;
};

class ParseXpath {
  public xpath(xpath, html): SelectedValue[] {
    const doc = new DOMParser({ errorHandler: {} }).parseFromString(html);
    return Xpath.select(xpath, doc);
  }

  public find(xpath, html): XpathType[] {
    const doc = new DOMParser({ errorHandler: {} }).parseFromString(html);
    const nodes = Xpath.select(xpath, doc);
    const newNodes: XpathType[] = [];
    for (let i = 0; i < nodes.length; i++) {
      newNodes.push({
        html: nodes[i].toString(),
        text: nodes[i].firstChild?.data?.trim(),
      });
    }
    return newNodes;
  }

  public findOne(xpath, html): XpathType {
    const doc = new DOMParser({ errorHandler: {} }).parseFromString(html);
    const nodes = Xpath.select(xpath, doc);
    return {
      html: nodes[0].toString(),
      text: nodes[0].firstChild?.data?.trim(),
    };
  }

  public text(xpath, html): string {
    const doc = new DOMParser({ errorHandler: {} }).parseFromString(html);
    return Xpath.select(`string(${xpath})`, doc) as unknown as string;
  }
}

export const $ = new ParseXpath();
