import { useEffect, useState } from 'react';
import HorizontalScroll from './components/HorizontalScroll';
import LoadingScreen from './components/LoadingScreen';
import Section1 from './sections/Section1';
import Section2 from './sections/Section2';
import Section3 from './sections/Section3';
import Section4 from './sections/Section4';
import Section5 from './sections/Section5';
import Section6 from './sections/Section6';
import Section7 from './sections/Section7';
import Section8 from './sections/Section8';
import End from './sections/End';
import { preloadImages, preloadUrls } from './preloadAssets';

const MIN_LOADING_MS = 1200;

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      preloadImages(preloadUrls),
      new Promise((r) => setTimeout(r, MIN_LOADING_MS)),
    ]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-dvh bg-black overflow-x-hidden">
      <HorizontalScroll>
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        <Section7 />
        <Section8 />
      </HorizontalScroll>
      <End />
    </div>
  );
}

export default App;
