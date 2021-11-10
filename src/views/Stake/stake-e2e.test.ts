import "@testing-library/jest-dom";
import {
  clickElement,
  setupMetamask,
  connectWallet,
  selectorExists,
  waitSelectorExists,
  getSelectorTextContent,
  typeValue,
} from "../../helpers/testHelpers";
import puppeteer, { Browser, Page } from "puppeteer";
import { launch, Dappeteer } from "@chainsafe/dappeteer";

// TODO deploy contracts on temporary network
// TODO add eth to wallet
// TODO close Chromium after test case

var STAKE_AMOUNT = 0.1;

xdescribe("staking", () => {
  let browser: Browser;
  let metamask: Dappeteer;
  let page: Page;

  beforeEach(async () => {
    browser = await launch(puppeteer, { metamaskVersion: "v10.1.1" });

    metamask = await setupMetamask(browser);

    page = await browser.newPage();
    await page.goto("http://localhost:3000/#/stake");
    await page.bringToFront();
  });

  afterEach(async () => {
    await browser.close();
  });

  test("cannot stake without connected wallet", async () => {
    // Connect button should be available
    expect(await selectorExists(page, "#stake-connect-wallet")).toBeTruthy();

    // Stake button not visible
    expect(await selectorExists(page, "#stake-button")).toBeFalsy();
  });

  test("connects wallet", async () => {
    // Connect button should be available
    expect(await selectorExists(page, "#stake-connect-wallet")).toBeTruthy();

    await connectWallet(page, metamask);

    // Connect button should be replaced by "Approve"
    await page.bringToFront();
    expect(await waitSelectorExists(page, "#approve-stake-button")).toBeTruthy();
    expect(await selectorExists(page, "#stake-connect-wallet")).toBeFalsy();
  });

  test("approves staking", async () => {
    await connectWallet(page, metamask);

    // NOTE: we may want to re-enable this when moving onto a single-use testnet, as the approval status won't persist
    // *** Approve the staking function
    // await page.bringToFront();
    // Stake button (named "Approve")
    // await clickElement(page, "#approve-stake-button");
    // Bring Metamask front with the transaction modal
    // await metamask.confirmTransaction();
    // Approve the transaction
    // await metamask.approve();

    // Button should be replaced by "Stake"
    expect(await waitSelectorExists(page, "#stake-button")).toBeTruthy();
    expect(await selectorExists(page, "#approve-stake-button")).toBeFalsy();
  });

  test("staking", async () => {
    await connectWallet(page, metamask);

    // Perform staking
    await typeValue(page, "#amount-input", STAKE_AMOUNT.toString());
    await clickElement(page, "#stake-button");
    await metamask.confirmTransaction();

    // Staked balance should be written as 0.1 sOHM
    expect(await getSelectorTextContent(page, "#user-staked-balance")).toEqual("0.1 sOHM");
    expect(await waitSelectorExists(page, "#unstake-button")).toBeTruthy();
    expect(await selectorExists(page, "#stake-button")).toBeFalsy();
  });

  test("unstaking", async () => {
    await connectWallet(page, metamask);

    // Perform staking
    await typeValue(page, "#amount-input", STAKE_AMOUNT.toString());
    await clickElement(page, "#stake-button");
    await metamask.confirmTransaction();

    // Perform unstaking
    await typeValue(page, "#amount-input", STAKE_AMOUNT.toString());
    await clickElement(page, "#unstake-button");
    await metamask.confirmTransaction();

    // Staked balance should be written as 0.0 sOHM
    expect(await getSelectorTextContent(page, "#user-staked-balance")).toEqual("0 sOHM");
  });
});
