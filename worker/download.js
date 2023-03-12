import axios from 'axios';
import { Window } from 'happy-dom';
import xlsx from 'xlsx';

export default async function ({ id }) {
  const url = `http://db.ncdd.gov.kh/gazetteer/province/downloadprovince.castle?pv=${id}`;
  const [{ data }, info] = await Promise.all([
    axios.get(url, { responseType: 'arraybuffer' }),
    province(id),
  ]);

  return {
    ...info,
    children: tree(json(data)),
  }
}

export async function province(id) {
  const response = await axios.post(
    "http://db.ncdd.gov.kh/gazetteer/view/province.castle",
    new URLSearchParams({ pv: id })
  );

  const window = new Window()
  window.document.body.innerHTML = response.data;
  const table = window.document.querySelector("table");
  return Object.fromEntries([...table.querySelectorAll('tr')].map(el => {
    const [header, value] = el.querySelectorAll('td');
    return [
      header.textContent
        .replace(/&nbsp;/, '')
        .trim()
        .replace(/\s+/g, "_")
        .toLowerCase(),
      value.textContent.trim()
    ];
  }));
}


export function json(buf) {

  function delete_row(ws, row_index) {
    const ec = (r, c) => xlsx.utils.encode_cell({ r: r, c: c })
    const variable = xlsx.utils.decode_range(ws["!ref"])
    for (let R = row_index; R < variable.e.r; ++R) {
      for (let C = variable.s.c; C <= variable.e.c; ++C) {
        ws[ec(R, C)] = ws[ec(R + 1, C)];
      }
    }
    variable.e.r--
    ws['!ref'] = xlsx.utils.encode_range(variable.s, variable.e);
  }

  const wb = xlsx.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  delete_row(ws, 0);
  delete_row(ws, 0);
  const rows = xlsx.utils.sheet_to_json(ws);

  const tranformKey = (k) => k.toLowerCase()
    .replace(/[\(\)]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/^name_/, '');

  return rows.map(row => {
    return Object.fromEntries(
      Object.entries(row)
        .map(([key, value]) => [tranformKey(key), value])
    )
  })
}


function tree(input) {

  const values = [];

  let district;
  let commune;

  for (const item of input) {

    // start cursor
    if (['ស្រុក', 'ក្រុង', 'ខណ្ឌ'].includes(item.type)) {

      if (district) {
        values.push(district);
      }

      district = item;
      district.children = [];
      commune = null;
      continue;
    }

    if (['ឃុំ', 'សង្កាត់'].includes(item.type)) {
      commune = item;
      commune.children = [];
      district.children.push(commune);
      continue;
    }

    if (['ភូមិ'].includes(item.type)) {
      commune.children.push(item);
      continue;
    }

    // throw
    console.log(item);
  }

  return values;
}
