# 📦 Sheets-Sync

Pipeline centralizado que convierte cualquier catálogo de Google Sheets en un archivo `datos.json` y lo despliega automáticamente a la carpeta de Hostinger del cliente vía FTP.

## ¿Qué hace?

Cuando el dueño de un negocio presiona el botón "Publicar" en su Google Sheets, este sistema:

1. Recibe un webhook desde Google Apps Script
2. Descarga el inventario en formato **TSV (Tab-Separated Values)** para soportar comas en los textos.
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

El archivo de inventario del cliente debe tener estas **10 columnas** exactas, en este orden:

| Columna | Nombre | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- |
| **A** | **ID** | `LAP-001` | Código interno (SKU). |
| **B** | **Nombre** | `Laptop Dell` | Título del producto. Obligatorio. |
| **C** | **Precio USD** | `1250.00` | Precio en dólares (número puro). |
| **D** | **Categoría** | `Laptops` | Para filtros visuales. |
| **E** | **Descripción** | `Notebook ultraligera...` | Texto libre. |
| **F** | **Imagen** | `https://...` | URL de la foto. |
| **G** | **Marca** | `Dell` | (Opcional) Filtro por marcas. |
| **H** | **Unidad** | `1 un.` | (Opcional) Ej: Litro, Caja, Kg. |
| **I** | **Destacado** | `SI` o `NO` | (Opcional) Para el inicio/ofertas. |
| **J** | **Atributos** | `16GB RAM\|512GB SSD` | (Opcional) Specs separados por `\|`. |

> 💡 **Formato TSV:** El archivo se descarga como TSV (separado por tabulaciones), lo que significa que el dueño puede usar todas las comas (`,`) que quiera en las descripciones sin romper el sistema.

## Formato de datos.json generado

```json
{
  "telefono": "591XXXXXXXXX",
  "tipo_cambio": 6.96,
  "actualizado": "2026-09-05T19:17:18.183Z",
  "productos": [
    {
      "id": "LAP-001",
      "nombre": "Laptop Dell",
      "precio_usd": 1250,
      "precio_bs": 8700,
      "categoria": "Laptops",
      "descripcion": "Notebook ultraligera...",
      "imagen": "https://...",
      "marca": "Dell",
      "unidad": "1 un.",
      "destacado": true,
      "atributos": [
        "16GB RAM",
        "512GB SSD"
      ]
    }
  ]
}
```

## Variables de entorno

### Pruebas locales (`.env`)

```env
TSV_URL=https://docs.google.com/spreadsheets/d/TU_ID/pub?output=tsv
TELEFONO=591XXXXXXXXX
TIPO_CAMBIO=6.96
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
  "tsv_url":    "URL pública del TSV del cliente (publicado como TSV)",
  "telefono":   "Número de WhatsApp del negocio",
  "tipo_cambio": "6.96",
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
