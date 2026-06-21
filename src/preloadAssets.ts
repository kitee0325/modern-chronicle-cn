/**
 * 集中导入首屏所需静态资源，用于 loading 阶段预加载。
 * 与各 section / overlay 实际使用的 import 保持一致。
 */
import s1bg from './assets/section1/background.png';
import s1front from './assets/section1/frontend.png';
import s2bg from './assets/section2/background.png';
import s2front from './assets/section2/frontend.png';
import s3bg from './assets/section3/background.png';
import s3front from './assets/section3/frontend.png';
import s3letter from './assets/section3/letter.png';
import s4bg from './assets/section4/background.png';
import s4front from './assets/section4/frontend.png';
import s5bg from './assets/section5/background.png';
import s5front from './assets/section5/frontend.png';
import s6bg from './assets/section6/background.png';
import s6front from './assets/section6/frontend.png';
import s7bg from './assets/section7/background.png';
import s7front from './assets/section7/frontend.png';
import s8bg from './assets/section8/background.png';
import s8front from './assets/section8/frontend.png';
import cotton from './assets/cotton-layer.png';
import weathered from './assets/weathered-layer.png';

export const preloadUrls: string[] = [
  s1bg,
  s1front,
  s2bg,
  s2front,
  s3bg,
  s3front,
  s3letter,
  s4bg,
  s4front,
  s5bg,
  s5front,
  s6bg,
  s6front,
  s7bg,
  s7front,
  s8bg,
  s8front,
  cotton,
  weathered,
];

/** 预加载所有图片，单张失败不阻塞，全部请求发出后 resolve */
export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}
