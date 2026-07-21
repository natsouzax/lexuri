import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://www.youtube.com/watch?v=7wtfhZwyrcc', { waitUntil: 'domcontentloaded' })
  const webdriver = await page.evaluate(() => navigator.webdriver)
  console.log('navigator.webdriver:', webdriver)
  await browser.close()
}

main()
