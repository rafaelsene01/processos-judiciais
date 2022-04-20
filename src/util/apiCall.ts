import fetch, { RequestInit } from "node-fetch";
import { TextDecoder } from "util";

export const Fetch = async (url: string, request: RequestInit, params?) => {
  try {
    const response = params
      ? await fetch(
          Object.keys(params).reduce((newUrl, i) => {
            newUrl.searchParams.append(i, params[i]);
            return newUrl;
          }, new URL(url)),
          request
        )
      : await fetch(url, request);

    let headers = {};
    for (const header of response.headers) {
      headers = { ...headers, [header[0]]: header[1] };
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const data = decoder.decode(buffer);
    return { headers, data };
  } catch (error) {
    return { error };
  }
};
