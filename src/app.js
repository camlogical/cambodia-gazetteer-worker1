import '../styles/reset.css'
import '../styles/app.css'

async function main() {
  console.time('download')
  const url = "https://cdn.jsdelivr.net/gh/seanghay/cambodia-gazetteer-worker@main/data/all.minified.json";
  const res = await fetch(url);
  const data = await res.json();
  console.timeEnd('download');
  console.log(data);
  
}

main();