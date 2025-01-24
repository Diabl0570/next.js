import { nextTestSetup } from "e2e-utils";

describe("redirects and rewrites", () => {
  const { next } = nextTestSetup({
    files: __dirname,
    dependencies: {
      typescript: "latest",
      "@types/react": "latest",
      "@types/node": "latest",
      "path-to-regexp": "6.1.0",
    },
  });

  // TODO: investigate test failures on deploy
  if ((global as any).isNextDeploy) {
    it("should skip for deploy", () => {});
    return;
  }
  /**
   * All test will use a link/button to navigate to '/*-before' which should be redirected by correct redirect/rewrite to '/*-after'
   */
  describe.each(["link", "button"])("navigation using %s", (testType) => {
    it("should rewrite to external domain from next.config.js correctly", async () => {
      const browser = await next.browser("/");
      await browser
        .elementById(`${testType}-gb-en-cart`)
        .click()
        .waitForElementByCss("#cart");
      const url = new URL(await browser.url());
      console.log("url.pathname", url.pathname);
      await browser.waitForElementByCss("#cart2");
      expect(url.pathname).toEndWith("cart/");
      expect(url.pathname).toEndWith("block");
    });

    it("should rewrite internal from next.config.js correctly", async () => {
      const browser = await next.browser("/");
      await browser
        .elementById(`${testType}-nl-nl-cart`)
        .click()
        .waitForElementByCss("#cart");
      const url = new URL(await browser.url());
      expect(url.pathname).toEndWith("cart/");
    });
  });
});
