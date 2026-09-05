# 📦 Sheets-Sync

Pipeline centralizado que convierte cualquier catálogo de Google Sheets en un archivo `datos.json` y lo despliega automáticamente a la carpeta de Hostinger del cliente vía FTP.

## ¿Qué hace?

Cuando el dueño de un negocio presiona el botón "Publicar" en su Google Sheets, este sistema:

1. Recibe un webhook desde Google Apps Script
2. Descarga el inventario en formato CSV
3. Lo convierte a un archivo `datos.json` limpio y ligero
4. Lo sube por FTP a la carpeta del cliente en Hostinger

La página web del cliente (con su propio diseño y marca) lee ese `datos.json` con un simple `fetch()` y renderiza el catálogo actualizado al instante.

## Estructura

```
sheets-sync/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Pipeline: recibe webhook → genera JSON → sube por FTP
├── scripts/
│   └── generar-datos.js      ← Descarga el CSV y genera datos.json
├── package.json
└── .gitignore
```

## Formato del Google Sheets

El archivo de inventario del cliente debe tener estas columnas en orden:

| A — id | B — nombre | C — precio | D — descripcion | E — url_imagen |
|--------|------------|------------|-----------------|----------------|
| 1      | Arroz 1kg  | 8.50       | Arroz blanco    | https://...    |

> ⚠️ El precio debe ser un número puro (sin símbolo de moneda ni puntos de miles). Las descripciones no deben contener comas.

## Formato de datos.json generado

```json
{
  "telefono": "591XXXXXXXXX",
  "actualizado": "2026-09-05T19:17:18.183Z",
  "productos": [
    {
      "id": "1",
      "nombre": "Arroz 1kg",
      "precio": 8.5,
      "descripcion": "Arroz blanco de primera",
      "imagen": "https://..."
    }
  ]
}
```

## Variables de entorno

### Pruebas locales (`.env`)

```env
CSV_URL=https://docs.google.com/spreadsheets/d/TU_ID/pub?output=csv
TELEFONO=591XXXXXXXXX
```

Ejecutar localmente:
```bash
node --env-file=.env scripts/generar-datos.js
```

### Producción (GitHub Secrets)

| Secret | Descripción |
|--------|-------------|
| `FTP_SERVER_HOSTINGER` | Dirección del servidor FTP |
| `FTP_USERNAME_HOSTINGER` | Usuario FTP de Hostinger |
| `FTP_PASSWORD_HOSTINGER` | Contraseña FTP |

## Webhook desde Google Apps Script

El script del cliente envía estos datos al activar el pipeline:

```javascript
"client_payload": {
  "csv_url":    "URL pública del CSV del cliente",
  "telefono":   "Número de WhatsApp del negocio",
  "cliente_id": "nombre-de-su-dominio.com"  // define la carpeta en Hostinger
}
```

## Cómo la página del cliente consume los datos

La página web del cliente (diseño propio, sin restricciones) solo necesita:

```javascript
fetch('/datos.json')
  .then(r => r.json())
  .then(({ productos, telefono }) => {
    // renderizar catálogo con el diseño propio del cliente
  });
```

## Arquitectura general

```
[Excel del cliente] → [Google Apps Script] → [GitHub Webhook]
                                                     ↓
                                           [GitHub Actions]
                                           (genera datos.json)
                                                     ↓
                                     [FTP → Hostinger del cliente]
                                                     ↓
                              [Página web del cliente lee datos.json]
```
