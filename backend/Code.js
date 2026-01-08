
/**
 * MASTER TEMPLATE ID - REPLACE THIS WITH YOUR ACTUAL FILE ID
 */
const MASTER_TEMPLATE_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const MASTER_FOLDER_ID = 'REPLACE_WITH_YOUR_FOLDER_ID'; 

// CONSTANTS FOR HEADER LAYOUT
const HEADER_KEY_ROW = 1;     // Row containing system keys (e.g., Akademik_Deskripsi)

// Default for Generic Sheets (Leger, Pertemuan) which have visual headers in rows 2 & 3
const DATA_START_ROW = 4;     

// MAPPING: Frontend Name -> Real Spreadsheet Name
const SHEET_MAP = {
  'legerNilaiSemester': 'db_leger_nilai',
  'pertemuan1': 'db_pertemuan1',
  'pertemuan2': 'db_pertemuan2',
  'pertemuan3': 'db_pertemuan3',
  'pertemuan4': 'db_pertemuan4',
  'pertemuan5': 'db_pertemuan5',
  'pertemuan6': 'db_pertemuan6'
};

function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<html><body style='font-family: sans-serif; text-align: center; margin-top: 50px;'>" +
    "<h1>Guru Wali API Service</h1>" +
    "<p style='color: green; font-weight: bold;'>Status: Online</p>" +
    "<p>Backend Google Apps Script berjalan normal.</p>" +
    "</body></html>"
  ).setTitle("Guru Wali Backend API");
}

function setupMasterTemplate() {
  const ss = SpreadsheetApp.openById(MASTER_TEMPLATE_ID);
  Object.keys(SHEET_MAP).forEach(frontendName => {
    checkAndSetupSheet(ss, frontendName);
  });
}

function doPost(e) {
  const output = ContentService.createTextOutput();
  let result = {};

  try {
    if (!e.postData || !e.postData.contents) {
       return output.setContent(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);
    }

    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'login') {
      const fileId = loginAndGetFileId(params.email);
      result = { success: true, fileId: fileId };
    } 
    else if (action === 'getStudents') {
      result = getStudents(params.email);
    } 
    else if (action === 'getIdentity') {
      result = getIdentity(params.email, params.sheetName);
    } 
    else if (action === 'getProker') {
      result = getProker(params.email);
    }
    else if (action === 'getJadwal') {
      result = getJadwal(params.email);
    }
    else if (action === 'getGenericData') {
      result = getGenericData(params.sheetName, params.email);
    }
    else if (action === 'updateSheetData') {
      result = updateSheetData(params.sheetName, params.data, params.email);
    }
    else if (action === 'getExportPdfUrl') {
      result = getExportPdfUrl(params.sheetName, params.email);
    } else {
      result = { error: "Unknown action: " + action };
    }
  } catch (error) {
    result = { error: error.toString(), stack: error.stack };
  }

  return output.setContent(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- CORE UTILITIES ---

function loginAndGetFileId(email) {
  if (!email) email = Session.getActiveUser().getEmail();
  if (!email) return MASTER_TEMPLATE_ID; 

  const userFile = findFileByName(email + "_GuruWali");
  if (userFile) {
    return userFile.getId();
  } else {
    return cloneTemplate(email);
  }
}

function cloneTemplate(email) {
  const template = DriveApp.getFileById(MASTER_TEMPLATE_ID);
  const folder = DriveApp.getFolderById(MASTER_FOLDER_ID);
  const newFile = template.makeCopy(email + "_GuruWali", folder);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  return newFile.getId();
}

function findFileByName(filename) {
  const files = DriveApp.getFilesByName(filename);
  if (files.hasNext()) return files.next();
  return null;
}

function getSpreadsheet(email) {
  let fileId = null;
  if (!email) {
     fileId = MASTER_TEMPLATE_ID; // Fallback
  } else {
     fileId = loginAndGetFileId(email);
  }
  return SpreadsheetApp.openById(fileId);
}

// --- DATE HELPERS ---

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Convert YYYY-MM-DD -> 20 Januari 2024 (For Sheet Storage)
function formatToIndonesianDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split("-"); // [YYYY, MM, DD]
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${day} ${MONTHS_ID[monthIndex]} ${year}`;
  }
  return dateStr;
}

// Convert 20 Januari 2024 -> YYYY-MM-DD (For Frontend API)
function parseIndonesianDateToIso(indoDateStr) {
  if (!indoDateStr || typeof indoDateStr !== 'string') return indoDateStr;
  
  const parts = indoDateStr.split(" ");
  if (parts.length !== 3) return indoDateStr; // Not matching format

  const day = parts[0].padStart(2, '0');
  const monthName = parts[1];
  const year = parts[2];

  const monthIndex = MONTHS_ID.indexOf(monthName);
  if (monthIndex === -1) return indoDateStr;

  const month = (monthIndex + 1).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- STATIC DATA HANDLERS ---

function getStudents(email) {
  const ss = getSpreadsheet(email);
  const sheet = ss.getSheetByName('dataSiswa');
  if(!sheet) return [];
  const lastRow = sheet.getLastRow();
  const STUDENT_START_ROW = 2;

  if (lastRow < STUDENT_START_ROW) return []; 
  
  const numRows = lastRow - (STUDENT_START_ROW - 1);
  const data = sheet.getRange(STUDENT_START_ROW, 1, numRows, 8).getValues();
  
  return data.map(row => ({
    no: row[0],
    name: row[1],
    nis: row[2],
    nisn: row[3],
    class: row[4],
    gender: row[5],
    contact: row[6],
    notes: row[7]
  })).filter(s => s.name !== "" && String(s.no).trim().toUpperCase() !== "NO"); 
}

function getIdentity(email, sheetName) {
  const ss = getSpreadsheet(email);
  const targetSheet = sheetName || 'identitas';
  const sheet = ss.getSheetByName(targetSheet);
  
  if(!sheet) return {};
  
  return {
    namaGuru: sheet.getRange("B1").getValue(),
    nipGuru: sheet.getRange("B2").getValue(),
    kepalaSekolah: sheet.getRange("B3").getValue(),
    nipKs: sheet.getRange("B4").getValue(),
    bulan: sheet.getRange("B5").getValue(),
    semester: sheet.getRange("B6").getValue(),
    tahun: sheet.getRange("B7").getValue(),
    logoUrl: sheet.getRange("B8").getValue() 
  };
}

function getProker(email) {
  const ss = getSpreadsheet(email);
  const sheet = ss.getSheetByName('proker');
  if(!sheet) return [];
  const data = sheet.getRange("A5:D8").getValues();
  return data.map((row, idx) => ({
    id: idx,
    no: row[0],      
    pilar: row[1],    
    kegiatan: row[2], 
    indikator: row[3] 
  }));
}

function getJadwal(email) {
  const ss = getSpreadsheet(email);
  const sheet = ss.getSheetByName('jadwal');
  if(!sheet) return [];
  
  // Revised Ranges: Gasal A8:C11, Genap A15:C18
  const gasalData = sheet.getRange("A8:C11").getValues();
  const genapData = sheet.getRange("A15:C18").getValues();
  
  const result = [];
  
  gasalData.forEach((r, i) => {
    if (String(r[0]).trim() !== "" || String(r[1]).trim() !== "") {
      result.push({ id: i, bulan: r[0], kegiatan: r[1], keterangan: r[2], semesterType: 'Gasal' });
    }
  });

  genapData.forEach((r, i) => {
    if (String(r[0]).trim() !== "" || String(r[1]).trim() !== "") {
      result.push({ id: i + 4, bulan: r[0], kegiatan: r[1], keterangan: r[2], semesterType: 'Genap' });
    }
  });
  
  return result;
}

// --- DYNAMIC / GENERIC DATA HANDLERS ---

function checkAndSetupSheet(ss, frontendName) {
  const dbName = SHEET_MAP[frontendName];
  if (!dbName) return null;

  let sheet = ss.getSheetByName(dbName);
  if (sheet) return sheet;

  sheet = ss.insertSheet(dbName);
  
  if (frontendName === 'legerNilaiSemester') {
    const keys = [
      "No", 
      "Akademik_Deskripsi", "Akademik_Tindak_Lanjut", "Akademik_Keterangan",
      "Karakter_Deskripsi", "Karakter_Tindak_Lanjut", "Karakter_Keterangan",
      "Sosial_Emosional_Deskripsi", "Sosial_Emosional_Tindak_Lanjut", "Sosial_Emosional_Keterangan",
      "Kedisiplinan_Deskripsi", "Kedisiplinan_Tindak_Lanjut", "Kedisiplinan_Keterangan",
      "Potensi_Minat_Deskripsi", "Potensi_Minat_Tindak_Lanjut", "Potensi_Minat_Keterangan"
    ];
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);

    const visualRow2 = [
      "NO", "AKADEMIK", "", "", "KARAKTER", "", "", "SOSIAL & EMOSIONAL", "", "", 
      "KEDISIPLINAN", "", "", "POTENSI & MINAT", "", ""
    ];
    sheet.getRange(2, 1, 1, visualRow2.length).setValues([visualRow2]).setFontWeight("bold").setHorizontalAlignment("center");
    
    sheet.getRange("B2:D2").merge();
    sheet.getRange("E2:G2").merge();
    sheet.getRange("H2:J2").merge();
    sheet.getRange("K2:M2").merge();
    sheet.getRange("N2:P2").merge();
    sheet.getRange("A2:A3").merge().setVerticalAlignment("middle");

    const visualRow3 = [
       "", "Deskripsi", "Tindak Lanjut", "Ket", "Deskripsi", "Tindak Lanjut", "Ket",
       "Deskripsi", "Tindak Lanjut", "Ket", "Deskripsi", "Tindak Lanjut", "Ket", "Deskripsi", "Tindak Lanjut", "Ket"
    ];
    sheet.getRange(3, 1, 1, visualRow3.length).setValues([visualRow3]).setFontWeight("bold").setBorder(true, true, true, true, true, true);
  }

  else if (frontendName.startsWith('pertemuan') && frontendName !== 'pertemuan6') {
    const keys = ["No", "Tanggal_Pertemuan", "Topik_Masalah", "Tindak_Lanjut", "Keterangan", "Format_Individu_Kelompok", "Persentase_Kehadiran"];
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    sheet.getRange("A2:G2").merge().setValue(frontendName.toUpperCase().replace("PERTEMUAN", "PERTEMUAN ")).setFontWeight("bold").setHorizontalAlignment("center");
    const headers = ["NO", "TANGGAL", "TOPIK PERMASALAHAN", "TINDAK LANJUT", "KETERANGAN", "FORMAT (IND/KLP)", "% KEHADIRAN"];
    sheet.getRange(3, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBorder(true, true, true, true, true, true);
  }

  else if (frontendName === 'pertemuan6') {
     const keys = [
         "No", "Tanggal_Pertemuan", "Topik_Masalah", "Tindak_Lanjut", "Keterangan", "Format_Individu_Kelompok", "Persentase_Kehadiran",
         "Hasil_Pemantauan_dan_Pertemuan", "Rekomendasi_Tindak_Lanjut"
     ];
     sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
     sheet.getRange("A2:I2").merge().setValue("PERTEMUAN 6 (FINAL & REKAP)").setFontWeight("bold").setHorizontalAlignment("center");
     const headers = [
         "NO", "TANGGAL", "TOPIK PERMASALAHAN", "TINDAK LANJUT", "KETERANGAN", "FORMAT", "% HADIR", "HASIL PEMANTAUAN", "REKOMENDASI"
     ];
     sheet.getRange(3, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBorder(true, true, true, true, true, true);
  }
  
  sheet.hideRows(1);
  return sheet;
}

function getGenericData(frontendName, email) {
  const ss = getSpreadsheet(email);
  const dbName = SHEET_MAP[frontendName] || frontendName;
  
  let sheet;
  if (SHEET_MAP[frontendName]) {
      sheet = checkAndSetupSheet(ss, frontendName);
  } else {
      sheet = ss.getSheetByName(dbName);
  }

  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < DATA_START_ROW || lastCol < 1) return [];

  const headers = sheet.getRange(HEADER_KEY_ROW, 1, 1, lastCol).getValues()[0];
  const data = sheet.getRange(DATA_START_ROW, 1, lastRow - (DATA_START_ROW - 1), lastCol).getValues();

  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      if(header) {
        let val = row[index];
        // Convert Back to ISO date for Frontend Date Picker if needed
        if (typeof val === 'string' && val.match(/\d{1,2}\s[A-Za-z]+\s\d{4}/)) {
           val = parseIndonesianDateToIso(val);
        }
        obj[String(header).trim()] = val;
      }
    });
    return obj;
  });
}

function updateSheetData(frontendName, data, email) {
  const ss = getSpreadsheet(email);
  const dbName = SHEET_MAP[frontendName] || frontendName;
  let sheet = ss.getSheetByName(dbName);

  if (!sheet && SHEET_MAP[frontendName]) {
      sheet = checkAndSetupSheet(ss, frontendName);
  }
  
  if (!sheet) return false;

  if (frontendName === 'identitas' || frontendName === 'sampul') {
    sheet.getRange("B1").setValue(data.namaGuru);
    sheet.getRange("B2").setValue(data.nipGuru);
    sheet.getRange("B3").setValue(data.kepalaSekolah);
    sheet.getRange("B4").setValue(data.nipKs);
    sheet.getRange("B5").setValue(data.bulan);
    sheet.getRange("B6").setValue(data.semester);
    sheet.getRange("B7").setValue(data.tahun);
    sheet.getRange("B8").setValue(data.logoUrl || ""); 
  } 
  else if (frontendName === 'proker') {
    const values = data.map(item => [item.no, item.pilar, item.kegiatan, item.indikator]);
    sheet.getRange(5, 1, 4, 4).setValues(values);
  }
  else if (frontendName === 'jadwal') {
    const gasal = data.filter(d => d.semesterType === 'Gasal').map(d => [d.bulan, d.kegiatan, d.keterangan]);
    const genap = data.filter(d => d.semesterType === 'Genap').map(d => [d.bulan, d.kegiatan, d.keterangan]);
    
    // Revised Range: Write exactly to A8 and A15
    if (gasal.length > 0) sheet.getRange(8, 1, gasal.length, 3).setValues(gasal);
    if (genap.length > 0) sheet.getRange(15, 1, genap.length, 3).setValues(genap);
  }
  else if (frontendName === 'dataSiswa') {
    const maxRows = sheet.getMaxRows();
    if (maxRows >= 2) {
      sheet.getRange(2, 1, maxRows - 1, 8).clearContent();
    }
    
    if (data.length > 0) {
      const values = data.map((s, idx) => [
        idx + 1, 
        s.name, 
        "'" + s.nis,  // Force string to keep leading zeros
        "'" + s.nisn, // Force string to keep leading zeros
        s.class, 
        s.gender || '', s.contact || '', s.notes || ''
      ]);
      sheet.getRange(2, 1, values.length, 8).setValues(values);
    }
    SpreadsheetApp.flush();
    
    syncStudentToDbSheets(ss, data);
  }
  else {
      const studentId = data.studentId;
      if (!studentId) return false;

      const lastRow = sheet.getLastRow();
      let rowIndex = -1;
      
      if (lastRow >= DATA_START_ROW) {
          const ids = sheet.getRange(DATA_START_ROW, 1, lastRow - (DATA_START_ROW - 1), 1).getValues().flat();
          const foundIdx = ids.findIndex(id => String(id) == String(studentId)); 
          if (foundIdx !== -1) rowIndex = foundIdx + DATA_START_ROW;
      }

      if (rowIndex === -1) {
          if (lastRow < DATA_START_ROW) {
              rowIndex = DATA_START_ROW;
          } else {
              rowIndex = lastRow + 1;
          }
          sheet.getRange(rowIndex, 1).setValue(studentId);
      }

      const lastCol = Math.max(sheet.getLastColumn(), 1);
      let headers = sheet.getRange(HEADER_KEY_ROW, 1, 1, lastCol).getValues()[0];
      
      Object.keys(data).forEach(key => {
          if (key === 'studentId') return;
          let colIndex = headers.indexOf(key);
          if (colIndex === -1) {
              colIndex = headers.length;
              sheet.getRange(HEADER_KEY_ROW, colIndex + 1).setValue(key);
              headers.push(key);
          }
          
          let val = data[key];
          // If value looks like date YYYY-MM-DD, convert it to Indonesian Text for Spreadsheet
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
             val = formatToIndonesianDate(val);
          }
          
          sheet.getRange(rowIndex, colIndex + 1).setValue(val);
      });
  }
  
  return true;
}

function syncStudentToDbSheets(ss, studentList) {
  const targets = Object.keys(SHEET_MAP).map(k => SHEET_MAP[k]);
  
  targets.forEach(dbName => {
    let sheet = ss.getSheetByName(dbName);
    if(!sheet) return;
    
    const lastRow = sheet.getLastRow();
    let existingIds = [];
    if(lastRow >= DATA_START_ROW) {
       existingIds = sheet.getRange(DATA_START_ROW, 1, lastRow - (DATA_START_ROW - 1), 1).getValues().flat().map(String);
    }
    
    const missing = studentList.filter(s => !existingIds.includes(String(s.no)));
    
    if(missing.length > 0) {
       let startAppendRow = lastRow < DATA_START_ROW ? DATA_START_ROW : lastRow + 1;
       const newIds = missing.map(s => [s.no]);
       sheet.getRange(startAppendRow, 1, newIds.length, 1).setValues(newIds);
    }
  });
}

function getExportPdfUrl(frontendName, email) {
  const ss = getSpreadsheet(email);
  const dbName = SHEET_MAP[frontendName] || frontendName;
  const sheet = ss.getSheetByName(dbName);
  if (!sheet) return { url: null };
  const ssId = ss.getId();
  const sheetId = sheet.getSheetId();
  const url = "https://docs.google.com/spreadsheets/d/" + ssId + "/export?format=pdf&gid=" + sheetId + "&size=A4&portrait=true&fitw=true&gridlines=false&printtitle=false&sheetnames=false&pagenum=CENTER";
  return { url: url };
}