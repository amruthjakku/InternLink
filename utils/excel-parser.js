/**
 * Secure Excel parser with input validation and safety measures
 * Wraps the xlsx library with additional security checks
 */

import * as XLSX from 'xlsx';
import { validateBody, fileValidation } from './validation.js';

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Maximum number of rows to prevent DoS
const MAX_ROWS = 10000;

// Maximum number of sheets
const MAX_SHEETS = 10;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * Validate file before processing
 */
function validateFile(file, filename) {
  // Check file size
  if (file.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file extension
  const extension = filename.toLowerCase().split('.').pop();
  if (!['xlsx', 'xls', 'csv'].includes(extension)) {
    throw new Error('Invalid file type. Only Excel and CSV files are allowed.');
  }

  // Basic magic number checks for Excel files
  if (extension === 'xlsx' || extension === 'xls') {
    // Check for ZIP signature (XLSX files are ZIP archives)
    const zipSignature = file.subarray(0, 4);
    const isZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4B;
    
    // Check for old Excel signature (XLS files)
    const xlsSignature = file.subarray(0, 8);
    const isXls = xlsSignature[0] === 0xD0 && xlsSignature[1] === 0xCF;
    
    if (!isZip && !isXls) {
      throw new Error('Invalid Excel file format');
    }
  }

  return true;
}

/**
 * Sanitize cell values to prevent injection attacks
 */
function sanitizeCell(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove potential formula prefixes
  if (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@')) {
    return value.substring(1);
  }

  // Remove null bytes and control characters
  return value.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Sanitize worksheet data
 */
function sanitizeWorksheet(worksheet) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Limit number of rows
  if (data.length > MAX_ROWS) {
    throw new Error(`Too many rows. Maximum ${MAX_ROWS} allowed.`);
  }

  // Sanitize each cell
  return data.map(row => 
    Array.isArray(row) ? row.map(sanitizeCell) : row
  );
}

/**
 * Safely parse Excel file with security measures
 */
export function parseExcelFile(buffer, filename, options = {}) {
  try {
    // Validate file first
    validateFile(buffer, filename);

    // Parse with restricted options to prevent XXE and other attacks
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellFormula: false,    // Disable formula parsing
      cellHTML: false,       // Disable HTML parsing
      cellNF: false,         // Disable number format parsing
      cellStyles: false,     // Disable style parsing
      cellText: true,        // Enable text parsing only
      dense: false,          // Use normal worksheet format
      sheetStubs: false,     // Don't create stubs for empty cells
      WTF: false,            // Disable 'What The Format' mode
      bookDeps: false,       // Don't parse dependencies
      bookFiles: false,      // Don't parse file list
      bookProps: false,      // Don't parse properties
      bookSheets: false,     // Don't parse sheet names
      bookVBA: false,        // Don't parse VBA
      ...options
    });

    // Limit number of sheets
    const sheetNames = workbook.SheetNames.slice(0, MAX_SHEETS);
    
    // Process sheets
    const result = {};
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (worksheet) {
        result[sheetName] = sanitizeWorksheet(worksheet);
      }
    }

    return {
      success: true,
      data: result,
      sheetNames,
      error: null
    };

  } catch (error) {
    console.error('Excel parsing error:', error);
    return {
      success: false,
      data: null,
      sheetNames: [],
      error: error.message
    };
  }
}

/**
 * Parse CSV file safely
 */
export function parseCSVFile(buffer, filename) {
  try {
    validateFile(buffer, filename);
    
    const csvText = buffer.toString('utf8');
    
    // Basic CSV validation
    if (csvText.length > MAX_FILE_SIZE) {
      throw new Error('CSV file too large');
    }

    // Split into lines and limit rows
    const lines = csvText.split('\n').slice(0, MAX_ROWS);
    
    // Parse CSV manually for better security control
    const data = lines.map(line => {
      // Simple CSV parsing (you might want to use a proper CSV parser)
      return line.split(',').map(cell => sanitizeCell(cell.trim()));
    }).filter(row => row.some(cell => cell && cell.length > 0));

    return {
      success: true,
      data: { 'Sheet1': data },
      sheetNames: ['Sheet1'],
      error: null
    };

  } catch (error) {
    console.error('CSV parsing error:', error);
    return {
      success: false,
      data: null,
      sheetNames: [],
      error: error.message
    };
  }
}

/**
 * Main function to parse any supported file type
 */
export function parseSpreadsheet(buffer, filename, options = {}) {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (extension === 'csv') {
    return parseCSVFile(buffer, filename);
  } else if (['xlsx', 'xls'].includes(extension)) {
    return parseExcelFile(buffer, filename, options);
  } else {
    return {
      success: false,
      data: null,
      sheetNames: [],
      error: 'Unsupported file type'
    };
  }
}

/**
 * Convert parsed data to standard format for user import
 */
export function formatUserData(data, sheetName = null) {
  try {
    // Get the first sheet if no sheet name specified
    const targetSheet = sheetName || Object.keys(data)[0];
    const rows = data[targetSheet];
    
    if (!rows || rows.length === 0) {
      throw new Error('No data found in spreadsheet');
    }

    // Assume first row is headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Map data to user objects
    const users = dataRows.map((row, index) => {
      const user = {};
      headers.forEach((header, headerIndex) => {
        if (header && row[headerIndex] !== undefined) {
          user[header.toLowerCase().trim()] = sanitizeCell(row[headerIndex]);
        }
      });
      
      // Validate required fields
      if (!user.gitlabusername && !user.username) {
        throw new Error(`Row ${index + 2}: GitLab username is required`);
      }
      
      return {
        gitlabUsername: user.gitlabusername || user.username,
        name: user.name || user.fullname || '',
        email: user.email || '',
        role: user.role || 'AI Developer Intern',
        college: user.college || user.collegename || '',
        assignedBy: 'bulk-import'
      };
    });

    return {
      success: true,
      data: users,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

export default {
  parseExcelFile,
  parseCSVFile,
  parseSpreadsheet,
  formatUserData,
  validateFile,
  sanitizeCell
};