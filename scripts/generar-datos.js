import { writeFileSync, mkdirSync } from 'fs';

const TSV_URL = process.env.TSV_URL;
const TELEFONO = process.env.TELEFONO;
const TIPO_CAMBIO = parseFloat(process.env.TIPO_CAMBIO) || 6.96;

if (!TSV_URL) {
  console.error('❌ Error: TSV_URL no está definido');
  process.exit(1);
}

if (!TELEFONO) {
  console.error('❌ Error: TELEFONO no está definido');
  process.exit(1);
}

console.log('📥 Descargando catálogo desde Google Sheets (formato TSV)...');
const response = await fetch(TSV_URL);

if (!response.ok) {
  console.error(`❌ Error descargando TSV: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const tsv = await response.text();
const filas = tsv.split('\n').slice(1); // Saltar la fila de cabeceras

const productos = filas
  .map(fila => {
    // IMPORTANTE: Separamos por tabulación, lo que evita que las comas rompan el formato
    const cols = fila.trim().split('\t');
    if (cols.length < 3 || !cols[1]?.trim()) return null; // Mínimo: ID, Nombre, Precio
    
    // Parsear Atributos separados por |
    const atributosCrudos = cols[9]?.trim() || '';
    const atributos = atributosCrudos ? atributosCrudos.split('|').map(a => a.trim()).filter(Boolean) : [];

    return {
      id: cols[0]?.trim() || '',
      nombre: cols[1]?.trim() || '',
      precio_usd: parseFloat(cols[2]?.trim()) || 0,
      precio_bs: Math.round((parseFloat(cols[2]?.trim()) || 0) * TIPO_CAMBIO * 100) / 100,
      categoria: cols[3]?.trim() || '',
      descripcion: cols[4]?.trim() || '',
      imagen: cols[5]?.trim() || '',
      marca: cols[6]?.trim() || '',
      unidad: cols[7]?.trim() || '',
      destacado: (cols[8]?.trim().toUpperCase() === 'SI' || cols[8]?.trim().toUpperCase() === 'TRUE'),
      atributos: atributos
    };
  })
  .filter(Boolean);

const datos = {
  telefono: TELEFONO,
  tipo_cambio: TIPO_CAMBIO,
  actualizado: new Date().toISOString(),
  productos
};

mkdirSync('./output', { recursive: true });
writeFileSync('./output/datos.json', JSON.stringify(datos, null, 2), 'utf-8');

console.log(`✅ datos.json generado con ${productos.length} producto(s)`);
console.log(`📞 Teléfono: ${TELEFONO}`);
console.log(`🕐 Actualizado: ${datos.actualizado}`);
