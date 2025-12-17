
import { IdentityData, Student, SheetName, ProkerItem, JadwalItem } from '../types';

// ============================================================================
// KONFIGURASI PENTING
// ============================================================================
// Tempelkan URL Web App Script Anda di sini (Pastikan diakhiri /exec)
// Deployment harus: "Execute as: Me" dan "Who has access: Anyone"
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbz__jJJBWVo9iuyIyYs1-Y7_93UqR6psfmsr7IpKc6QUf4961PiaJyy8hDvCss0zNG4gA/exec"; 
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

      const response = await fetch(finalUrl, {
        method: 'POST',
        body: JSON.stringify({ action: functionName, email: savedEmail, ...params }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
      });
      
      const result = await response.json();
      
      if (result.error) {
          throw new Error(result.error);
      }
      return result;

    } catch (e) {
      console.error("API Call Failed", e);
      throw e;
    }
  }

  // 3. Fallback only for Login mock
  if (functionName === 'login') return true;

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
