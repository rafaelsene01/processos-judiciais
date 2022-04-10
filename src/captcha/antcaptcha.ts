import {
  AntiCaptcha,
  AntiCaptchaError,
  ErrorCodes,
  INoCaptchaTaskProxyless,
  INoCaptchaTaskProxylessResult,
  // QueueTypes,
  TaskTypes,
} from "anticaptcha";

// Registering the API Client.
const AntiCaptchaAPI = new AntiCaptcha(process.env.anticaptcha as string);

export const anticaptcha = async (websiteURL, websiteKey) => {
  try {
    // Checking the account balance before creating a task. This is a conveniance method.
    if (!(await AntiCaptchaAPI.isBalanceGreaterThan(10))) {
      // You can dispatch a warning using mailer or do whatever.
      console.warn("Take care, you're running low on money !");
    }

    // // Get service stats
    // const stats = await AntiCaptchaAPI.getQueueStats(
    //   QueueTypes.RECAPTCHA_PROXYLESS
    // );

    // Creating nocaptcha proxyless task
    const taskId = await AntiCaptchaAPI.createTask<INoCaptchaTaskProxyless>({
      type: TaskTypes.NOCAPTCHA_PROXYLESS,
      websiteKey, // Some key from website
      websiteURL, // Some URL from website
    });

    // Waiting for resolution and do something
    const response =
      await AntiCaptchaAPI.getTaskResult<INoCaptchaTaskProxylessResult>(taskId);

    // console.log(`Response Code: ${response.solution.gRecaptchaResponse}`);
    return response.solution.gRecaptchaResponse.trim();
  } catch (e) {
    if (
      e instanceof AntiCaptchaError &&
      e.code === ErrorCodes.ERROR_IP_BLOCKED
    ) {
      console.log(e);
    }
  }
  throw new Error();
};
