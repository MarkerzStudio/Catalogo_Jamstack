import { writeFileSync, mkdirSync } from 'fs';

const CSV_URL = process.env.CSV_URL;
const TELEFONO = process.env.TELEFONO;

if (!CSV_URL) {
  console.error('❌ Error: CSV_URL no está definido');
  process.exit(1);
}

if (!TELEFONO) {
  console.error('❌ Error: TELEFONO no está definido');
  process.exit(1);
}

console.log('📥 Descargando catálogo desde Google Sheets...');
const response = await fetch(CSV_URL);

if (!response.ok) {
  console.error(`❌ Error descargando CSV: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const csv = await response.text();
const filas = csv.split('\n').slice(1); // Saltar la fila de cabeceras

const productos = filas
  .map(fila => {
    const cols = fila.trim().split(',');
    if (cols.length < 4 || !cols[1]?.trim()) return null;
    return {
      id: cols[0]?.trim(),
      nombre: cols[1]?.trim(),
      precio: parseFloat(cols[2]?.trim()) || 0,
      descripcion: cols[3]?.trim(),
      imagen: cols[4]?.trim() || ''
    };
  })
  .filter(Boolean);

const datos = {
  telefono: TELEFONO,
  actualizado: new Date().toISOString(),
  productos
};

mkdirSync('./output', { recursive: true });
writeFileSync('./output/datos.json', JSON.stringify(datos, null, 2), 'utf-8');

console.log(`✅ datos.json generado con ${productos.length} producto(s)`);
console.log(`📞 Teléfono: ${TELEFONO}`);
console.log(`🕐 Actualizado: ${datos.actualizado}`);
