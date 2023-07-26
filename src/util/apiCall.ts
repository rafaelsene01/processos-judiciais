import fetch, { RequestInit } from "node-fetch";
import { TextDecoder } from "util";
// import fetchCookie from "fetch-cookie"
import { CookieJar } from 'tough-cookie';
const cookieJar = new CookieJar();

export const getCaptchaToken = async () => {
  const data = await fetch('http://localhost:4444/',
    { method: "GET" }
  );
  const { token } = await data.json()
  return token
}

export const Fetch = async (url: string, request: RequestInit, params?) => {
  const cookies = await cookieJar.getCookies(url);
  const cookieHeader = cookies.map(cookie => cookie.cookieString()).join('; ');

  if (!request.headers) {
    request.headers = {};
  }

  request.headers["Cookie"] = cookieHeader;

  try {
    const response = params
      ? await fetch(
        Object.keys(params).reduce((newUrl, i) => {
          newUrl.searchParams.append(i, params[i]);
          return newUrl;
        }, new URL(url)),
        request
      )
      : await fetch(url,
        request
      );

    const setCookieHeaders = response.headers.raw()['set-cookie'];
    if (setCookieHeaders) {
      setCookieHeaders.forEach(cookie => {
        cookieJar.setCookieSync(cookie, url);
      });
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
      return { data: newData };
    }
    return { data };
  } catch (error) {
    return { error };
  }
};
