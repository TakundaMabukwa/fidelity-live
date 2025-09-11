import * as XLSX from 'xlsx';

export interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

export function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No data found in file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          blankrows: false
        });

        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        // Get headers from first row
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Convert rows to objects
        const parsedData: ParsedRow[] = rows.map(row => {
          const obj: ParsedRow = {};
          headers.forEach((header, index) => {
            if (header) {
              obj[header] = row[index] || null;
            }
          });
          return obj;
        });

        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsBinaryString(file);
  });
}

export function parseCSVFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        if (!csvText) {
          reject(new Error('No data found in file'));
          return;
        }

        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        // Parse CSV manually to handle quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => parseCSVLine(line));

        // Convert rows to objects
        const parsedData: ParsedRow[] = rows.map(row => {
          const obj: ParsedRow = {};
          headers.forEach((header, index) => {
            if (header) {
              obj[header] = row[index] || null;
            }
          });
          return obj;
        });

        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Error parsing CSV file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

export function transformToAssignedLoad(row: ParsedRow, targetDay: string) {
  // Map the parsed row to AssignedLoad interface using Excel column names
  const assignedLoad: Omit<AssignedLoad, 'id'> = {
    route_name: row['Route Name']?.toString() || null,
    rev: row['Rev']?.toString() || null,
    created: row['Created']?.toString() || null,
    queue_date: row['Queue Date']?.toString() || null,
    external_key: row['External Key']?.toString() || null,
    name: row['Name']?.toString() || null,
    display: row['Display']?.toString() || null,
    location_code: row['Location Code']?.toString() || null,
    location_name: row['Location Name']?.toString() || null,
    user_type: row['User Type']?.toString() || null,
    service_type: row['Service Type']?.toString() || null,
    atm_order_service_type: row['ATM Order Service Type']?.toString() || null,
    planned_arrival: row['Planned Arrival']?.toString() || null,
    planned_depart: row['Planned Depart']?.toString() || null,
    description: row['Description']?.toString() || null,
    device_user: row['Device User']?.toString() || null,
    duration: row['Duration']?.toString() || null,
    status: row['Status']?.toString() || null,
    current_status_since: row['Current Status Since']?.toString() || null,
    location: row['Location']?.toString() || null,
    current_queue: row['Current Queue']?.toString() || null,
    current_queue_desc: row['Current Queue Desc']?.toString() || null,
    queue_status: row['Queue Status']?.toString() || null,
    start_date: row['Start Date']?.toString() || null,
    status_since: row['Status Since']?.toString() || null,
    current_action: row['Current Action']?.toString() || null,
    current_action_desc: row['Current Action Desc']?.toString() || null,
    action_status: row['Action Status']?.toString() || null,
    casd: row['CASD']?.toString() || null,
    reject_reason: row['Reject Reason']?.toString() || null,
    reject_fault: row['Reject Fault']?.toString() || null,
    reject_comment: row['Reject Comment']?.toString() || null,
    created_on_client: row['Created On Client']?.toString() || null,
    added_by_user: row['Added By User']?.toString() || null,
    scan_type: row['Scan Type']?.toString() || null,
    print_duration: row['Print Duration']?.toString() || null,
    crew: row['crew'] ? JSON.parse(row['crew'].toString()) : null,
    once_off: row['once_off'] === 'true' || row['once_off'] === true,
    day: targetDay
  };

  return assignedLoad;
}

export function getTomorrowDayName(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[tomorrow.getDay()];
}
