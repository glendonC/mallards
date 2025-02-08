import Papa from 'papaparse';

export const parseCSV = (content: string): { data: string[][], errors: string[] } => {
  try {
    const parseResult = Papa.parse<string[]>(content, {
      delimiter: ',',
      newline: '\n',
      quoteChar: '"',
      escapeChar: '"',
      header: false,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    });

    if (parseResult.errors.length > 0) {
      return {
        data: [],
        errors: parseResult.errors.map(err => `Row ${err.row}: ${err.message}`)
      };
    }

    const data = parseResult.data as string[][];
    
    // Validate the parsed data
    const errors = validateCsvStructure(data);
    
    if (errors.length > 0) {
      return { data: [], errors };
    }

    return { data, errors: [] };
  } catch (error) {
    return {
      data: [],
      errors: [(error as Error).message]
    };
  }
};

const validateCsvStructure = (data: string[][]): string[] => {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('CSV file appears to be empty');
    return errors;
  }

  const headers = data[0];
  
  // Check for empty headers
  if (headers.length === 0) {
    errors.push('CSV must contain headers');
    return errors;
  }

  // Check for empty header names
  const emptyHeaders = headers.some(header => !header.trim());
  if (emptyHeaders) {
    errors.push('CSV contains empty header names');
  }

  // Check for duplicate headers
  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index
  );
  if (duplicateHeaders.length > 0) {
    errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
  }

  // Check each row
  const expectedColumns = headers.length;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Check for row length mismatch
    if (row.length !== expectedColumns) {
      errors.push(`Row ${i + 1} has ${row.length} columns, expected ${expectedColumns}`);
    }
  }

  // Verify required columns exist
  const requiredColumns = ['Transaction_ID', 'Transaction_Date', 'Amount', 
                          'Transaction_Type', 'Approval_Status', 'Region'];
  const missingColumns = requiredColumns.filter(col => 
    !headers.some(header => header === col)
  );
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return errors;
};