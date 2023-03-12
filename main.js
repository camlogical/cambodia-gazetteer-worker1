import fs from 'fs/promises'
import axios from 'axios';
import { Window } from "happy-dom";
import { Piscina } from "piscina";

const piscina = new Piscina({
  filename: new URL("./worker/download.js", import.meta.url).href,
})

export async function provincesCount() {
  const url = 'http://db.ncdd.gov.kh/gazetteer/view/index.castle';
  const { data: html } = await axios.get(url);
  const window = new Window();
  window.document.body.innerHTML = html;
  const el = window.document.querySelector('#browser');
  return el.children.length;
}

const total = await provincesCount();
console.log('total provinces: ' + total);

const promises = [];

for (let id = 1; id <= total; id++) {
  promises.push(piscina.run({ id }));
}

const provinces = await Promise.all(promises);
await fs.writeFile("./data/all.minified.json", JSON.stringify(provinces));
await fs.writeFile("./data/all.json", JSON.stringify(provinces, null, 2));

