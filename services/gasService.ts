
import { IdentityData, Student, SheetName, ProkerItem, JadwalItem } from '../types';

// ============================================================================
// KONFIGURASI PENTING
// ============================================================================
// Tempelkan URL Web App Script Anda di sini (Pastikan diakhiri /exec)
// Deployment harus: "Execute as: Me" dan "Who has access: Anyone"
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxRp5I2XbNHh6m1bOHhVJdfts-VHBMWkUxG12qZzuf-8wN5pV3dI833jC1vSyp2uixb_w/exec"; 
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callBackend = async (functionName: string, params: any = {}) => {
  // 1. Try Native GAS (If running inside Google Apps Script iframe/sidebar)
  if ((window as any).google?.script?.run) {
    console.log(`[GAS Native] Calling ${functionName}...`);
    return new Promise((resolve, reject) => {
      (window as any).google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](params); 
    });
  }

  // 2. Try Fetch via Hardcoded URL (For Android App / Localhost / Vercel)
  if (API_URL && API_URL.includes("script.google.com")) {
    try {
      const savedEmail = localStorage.getItem('user_email') || '';
      
      // Ensure URL ends with /exec
      let finalUrl = API_URL;
      if (!finalUrl.endsWith('/exec')) {
          finalUrl = finalUrl.replace(/\/$/, '') + '/exec';
      }

      // We explicitly set Content-Type to text/plain. 
      // This ensures the browser treats it as a "Simple Request" (no preflight OPTIONS),
      // which is critical because Google Apps Script Web Apps do not handle OPTIONS requests.
      const response = await fetch(finalUrl, {
        method: 'POST',
        redirect: 'follow', 
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({ action: functionName, email: savedEmail, ...params })
      });
      
      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
          throw new Error(result.error);
      }
      return result;

    } catch (e) {
      console.error("API Call Failed", e);
      // Helpful error message for NetworkError which often means CORS or deployment issues
      if (e instanceof TypeError && e.message === "Failed to fetch") {
          console.warn("CORS Error or Network Blocked. Check: 1. API_URL is correct. 2. Deployment is 'Anyone'. 3. Not blocked by browser extensions.");
      }
      throw e;
    }
  }

  // 3. Fallback only for Login mock (to allow testing without backend)
  if (functionName === 'login') {
      console.warn("Using Mock Login (No Backend Connection)");
      return true;
  }

  throw new Error("URL Script belum disetting di file services/gasService.ts");
};

export const gasService = {
  loginAndClone: async (email: string): Promise<boolean> => {
    // Just trigger login action to verify connection
    return callBackend('login', { email });
  },

  getStudents: async (): Promise<Student[]> => {
      const res = await callBackend('getStudents');
      return Array.isArray(res) ? res : [];
  },
  // Updated: Accept sheetName argument
  getIdentity: async (sheetName: string = 'identitas'): Promise<IdentityData> => 
      callBackend('getIdentity', { sheetName }),
      
  getProker: async (): Promise<ProkerItem[]> => {
      const res = await callBackend('getProker');
      return Array.isArray(res) ? res : [];
  },
  getJadwal: async (): Promise<JadwalItem[]> => {
      const res = await callBackend('getJadwal');
      return Array.isArray(res) ? res : [];
  },
  
  // NEW: Fetch generic key-value data for a sheet (Leger/Pertemuan)
  getGenericData: async (sheetName: string): Promise<any[]> => {
      const res = await callBackend('getGenericData', { sheetName });
      return Array.isArray(res) ? res : [];
  },

  updateSheetData: async (sheetName: SheetName, data: any): Promise<boolean> => {
     return callBackend('updateSheetData', { sheetName, data });
  },

  getExportPdfUrl: async (sheetName: string): Promise<string> => {
      const result: any = await callBackend('getExportPdfUrl', { sheetName });
      return result?.url || '';
  }
};
