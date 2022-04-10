import * as Captcha from "2captcha";

export const _2Captcha = async (websiteURL, websiteKey) => {
  const solver = new Captcha.Solver(process.env._2captcha as string);
  const { data } = await solver.recaptcha(websiteKey, websiteURL);
  return data;
};
