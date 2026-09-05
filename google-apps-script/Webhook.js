/**
 * Script para enviar datos del catálogo a GitHub Actions.
 * Este script se debe copiar y pegar en "Extensiones > Apps Script" dentro del Google Sheets del cliente.
 */

// 1️⃣ REEMPLAZA ESTO: Pon tu token de GitHub aquí (¡NO LO COMPARTAS CON NADIE!)
const GITHUB_TOKEN = 'TU_TOKEN_DE_GITHUB_AQUI'; 

// 2️⃣ REEMPLAZA ESTO: Tu usuario y el nombre del repositorio donde está el pipeline
const GITHUB_REPO = 'MarkerzStudio/Sheets-sync'; 

// 3️⃣ REEMPLAZA ESTO: La URL pública del TSV de la pestaña "Inventario"
const TSV_URL = 'URL_PUBLICA_DEL_TSV_AQUI'; 

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Actualizar Tienda')
      .addItem('Actualizar Catálogo ahora', 'dispararWebhook')
      .addToUi();
}

function dispararWebhook() {
  const sheetConfig = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuración");
  const ui = SpreadsheetApp.getUi();
  
  if (!sheetConfig) {
    ui.alert("❌ Error", "No se encontró la pestaña 'Configuración'.", ui.ButtonSet.OK);
    return;
  }

  // Leer valores de la pestaña "Configuración" (Columna B)
  const telefono = sheetConfig.getRange("B1").getValue().toString().trim();
  const tipoCambio = sheetConfig.getRange("B2").getValue().toString().trim();
  const clienteId = sheetConfig.getRange("B3").getValue().toString().trim();

  if (!telefono || !tipoCambio || !clienteId) {
    ui.alert("❌ Error", "Faltan datos en la pestaña de Configuración. Asegúrate de llenar Teléfono, Tipo de Cambio y Cliente ID.", ui.ButtonSet.OK);
    return;
  }

  const payload = {
    event_type: "webhook_actualizar_web",
    client_payload: {
      tsv_url: TSV_URL,
      telefono: telefono,
      tipo_cambio: tipoCambio,
      cliente_id: clienteId
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      "Authorization": "Bearer " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 204) {
      ui.alert("✅ ¡Éxito!", "La tienda se está actualizando. Los cambios se verán en 1 minuto.", ui.ButtonSet.OK);
    } else {
      ui.alert("❌ Error en GitHub", "Respuesta: " + response.getContentText(), ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert("❌ Error de Conexión", e.toString(), ui.ButtonSet.OK);
  }
}
