/**
 * MEDIA BUY TRIO — Google Apps Script
 * =====================================
 * Receives POST requests from the quote form and appends a new row
 * to the Google Sheet with columns: Timestamp | Name | Email | Brand | Budget | Message
 *
 * HOW TO DEPLOY:
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1BVToqNSpxPuyPy-gblw7Hf9rfjYp-ihZtSm52dNcdp8/edit
 *
 * 2. In the Sheet, add these headers in Row 1 (if not already there):
 *    A1: Timestamp   B1: Name   C1: Email   D1: Brand   E1: Budget   F1: Message
 *
 * 3. Click Extensions → Apps Script
 *
 * 4. Delete any existing code, then paste ALL of this file's contents.
 *
 * 5. Click Save (Ctrl+S), then click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy → copy the Web app URL
 *
 * 6. Open site/script.js and replace:
 *    PASTE_YOUR_DEPLOYED_SCRIPT_URL_HERE
 *    with the URL you just copied (keep the quotes).
 *
 * 7. Done! Test by submitting the quote form — a new row should appear in the Sheet.
 */

var SHEET_NAME = 'Sheet1'; // Change if your sheet tab has a different name

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),          // A: Timestamp
      data.name  || '',    // B: Name
      data.email || '',    // C: Email
      data.brand || '',    // D: Brand / Website
      data.budget || '',   // E: Monthly Budget
      data.message || ''   // F: Message / Goals
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: test this function manually in the Apps Script editor
function testAppend() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.appendRow([new Date(), 'Test Name', 'test@email.com', 'Test Brand', '$5K – $20K', 'Test message']);
}
