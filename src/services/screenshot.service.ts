import { chromium } from 'playwright';

export const captureReport = async (tripId: string, authorization: string) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security', // 🔥 핵심: CORS 보안 정책을 비활성화합니다.
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[브라우저 로그] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[브라우저 에러] ${err.message}`));

  const targetUrl = `${frontendUrl}/journeys/${tripId}/insight?capture=1`;
  const accessToken = authorization.split(' ')[1] as string;

  try {
    await page.route('**/*', route => {
      const url = route.request().url();

      if (url.includes('travel-tick.onrender.com')) {
        const headers = {
          ...route.request().headers(),
          Authorization: authorization,
        };
        route.continue({ headers });
      } else {
        route.continue();
      }
    });

    await page.addInitScript(
      data => {
        localStorage.setItem('onboarding_done', 'true');
        localStorage.setItem('tt_access_token_v1', data.token);
        localStorage.setItem(
          'tt_auth_v2',
          JSON.stringify({
            status: 'logged_in',
            user: {
              id: 'demo',
              name: 'capture',
              imageUrl: null,
            },
          }),
        );
      },
      { token: accessToken },
    );

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    await page
      .waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 })
      .catch(() => {
        console.log('스켈레톤 대기 시간이 초과되었으나 진행합니다.');
      });

    await page.waitForSelector('text="AI 소비 성향 리포트"', {
      timeout: 15000,
    });

    await page.waitForSelector('text="AI가 제안하는 더 나은 여행"', {
      timeout: 15000,
    });

    const selector = 'body > div#root > div > div > div';
    const targetElement = await page.$(selector);

    if (targetElement === null) {
      console.log('[실패] 캡처할 셀렉터를 찾지 못했습니다.');
      throw new Error('캡처 대상을 찾을 수 없습니다.');
    }

    await page.waitForTimeout(1000);
    const buffer = await targetElement.screenshot({ type: 'png' });

    return buffer;
  } catch (err) {
    console.error('캡처 중 에러 발생:', err);
    console.log('Error URL:', page.url());

    throw err;
  } finally {
    await browser.close();
  }
};
