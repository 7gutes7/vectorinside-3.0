const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const htmlPath = 'file://' + path.resolve(__dirname, 'generate_prism.html');
  console.log('Loading page:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  // Ensure Three.js and scene loaded
  await page.waitForFunction(() => typeof window.setFrameTime === 'function');

  const frameDir = path.resolve(__dirname, 'prism_frames');
  if (fs.existsSync(frameDir)) {
    fs.rmSync(frameDir, { recursive: true, force: true });
  }
  fs.mkdirSync(frameDir);

  const fps = 30;
  const duration = 5; // 5 seconds
  const totalFrames = fps * duration; // 150 frames

  console.log(`Capturing ${totalFrames} frames for 5-second 16:9 video...`);

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    await page.evaluate((t) => window.setFrameTime(t), time);
    const framePath = path.join(frameDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });

    if ((i + 1) % 30 === 0 || i === totalFrames - 1) {
      console.log(`Progress: ${i + 1}/${totalFrames} frames rendered (${Math.round(((i + 1) / totalFrames) * 100)}%)`);
    }
  }

  await browser.close();
  console.log('All 150 frames captured successfully!');
})();
