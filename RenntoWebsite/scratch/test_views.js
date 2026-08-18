const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/contact',
  'http://localhost:3000/privacy',
  'http://localhost:3000/terms'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`URL: ${url}`);
      console.log(`- Has viewport: ${text.includes('name="viewport"')}`);
      const headMatch = text.match(/<head>([\s\S]*?)<\/head>/);
      if (headMatch) {
        console.log(`- Head contents:\n${headMatch[1].substring(0, 500)}...\n`);
      } else {
        console.log(`- No head tag found!\n`);
      }
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }
}

check();
