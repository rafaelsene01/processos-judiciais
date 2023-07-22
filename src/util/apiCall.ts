import nodeFetch, { RequestInit } from "node-fetch";
import fetchCookie from 'fetch-cookie'
import { TextDecoder } from "util";

const fetch = fetchCookie(nodeFetch)

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
    const meta = /charset=(?:"?[^"]*"|^[^"]*$)/.exec(data);

    if (meta) {
      const newDecoder = new TextDecoder(
        meta[0].replace("charset=", "").replace(/"/g, "")
      );
      const newData = newDecoder.decode(buffer);
      return { headers, data: newData };
    }
    return { headers, data };
  } catch (error) {
    return { error };
  }
};
