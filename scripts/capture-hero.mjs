import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function captureHero() {
  console.log('🚀 Launching browser to capture hero animation frames...');
  
  const framesDir = path.join(process.cwd(), 'frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  
  // Navigate to hero capture route or local server
  const targetUrl = process.env.CAPTURE_URL || 'http://localhost:3000?mode=capture';
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  const totalFrames = 300; // 10 seconds @ 30 FPS
  console.log(`📸 Capturing ${totalFrames} frames...`);

  const heroElement = await page.$('.landing-hero') || await page.$('body');

  for (let f = 0; f < totalFrames; f++) {
    const timeInSeconds = f / 30;
    await page.evaluate((t) => {
      if (typeof window.__heroSetTime === 'function') {
        window.__heroSetTime(t);
      }
    }, timeInSeconds);

    const padFrame = String(f).padStart(4, '0');
    const framePath = path.join(framesDir, `frame_${padFrame}.png`);
    await heroElement.screenshot({ path: framePath });
  }

  await browser.close();
  console.log('✅ Frame capture complete. Encoding MP4 via FFmpeg...');

  const outputMp4 = path.join(process.cwd(), 'frontend', 'public', 'hero-clauding.mp4');
  
  try {
    execSync(
      `ffmpeg -y -framerate 30 -i "${framesDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -vf "scale=1200:-2" -movflags +faststart "${outputMp4}"`,
      { stdio: 'inherit' }
    );
    console.log(`🎉 Successfully generated MP4 video at: ${outputMp4}`);
  } catch (err) {
    console.error('⚠️ FFmpeg encoding failed. Ensure ffmpeg is installed in PATH.', err.message);
  }
}

captureHero();
