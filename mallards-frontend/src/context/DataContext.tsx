import React, { createContext, useContext, useState } from 'react';
import { MonitoringFocusType } from '../types/monitoring';

interface DetectionRule {
  threshold: number;
  timeWindow: string;
  sensitivity: number;
  visualizationType: 'line' | 'bar' | 'scatter';
  alertThreshold: number;
  predictionWindow: string;
  autoRefresh: boolean;
  groupBy: string[];
  culturalFactors?: string[];
  seasonalAdjustment?: boolean;
  regionalWeights?: boolean;
}

interface ColumnMapping {
  transactionDate?: string;
  amount?: string;
  transactionType?: string;
  approvalStatus?: string;
  region?: string;
  [key: string]: string | undefined;
}

interface DataContextType {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  csvData: string[][];
  setCsvData: (data: string[][]) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  columnMapping: ColumnMapping;
  setColumnMapping: React.Dispatch<React.SetStateAction<ColumnMapping>>;
  detectionRules: DetectionRule;
  setDetectionRules: React.Dispatch<React.SetStateAction<DetectionRule>>;
  resetData: () => void;
  getProcessedData: () => any[];
  selectedModels: {
    anomaly: string | null;
    predictive: string | null;
  };
  setSelectedModels: React.Dispatch<React.SetStateAction<{
    anomaly: string | null;
    predictive: string | null;
  }>>;
  selectedFocus: MonitoringFocusType | null;
  setSelectedFocus: (focus: MonitoringFocusType | null) => void;
}

const defaultDetectionRules: DetectionRule = {
  threshold: 1000,
  timeWindow: '24h',
  sensitivity: 2,
  visualizationType: 'line',
  alertThreshold: 0.8,
  predictionWindow: '7d',
  autoRefresh: true,
  groupBy: ['transactionType', 'region'],
  culturalFactors: [],
  seasonalAdjustment: true,
  regionalWeights: true
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [detectionRules, setDetectionRules] = useState<DetectionRule>(defaultDetectionRules);
  const [selectedModels, setSelectedModels] = useState<{
    anomaly: string | null;
    predictive: string | null;
  }>({
    anomaly: null,
    predictive: null
  });
  const [selectedFocus, setSelectedFocus] = useState<MonitoringFocusType | null>(null);

  const resetData = () => {
    setUploadedFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setDetectionRules(defaultDetectionRules);
  };

  //   if (!csvData.length || !Object.values(columnMapping).every(Boolean)) {
  //     return [];
  //   }

  //   return csvData.map(row => {
  //     const rowData: { [key: string]: any } = {};
  //     headers.forEach((header, index) => {
  //       // Map the data according to our column mapping
  //       Object.entries(columnMapping).forEach(([key, value]) => {
  //         if (value === header) {
  //           rowData[key] = row[index];
  //         }
  //       });
  //     });
  //     return rowData;
  //   });
  // };
  // In DataContext.tsx
  const getProcessedData = () => {

    if (!csvData.length || !Object.values(columnMapping).every(Boolean)) {
      console.log('Early return - missing data or mapping');
      return [];
    }
  
    const processed = csvData.map(row => {
      const rowData: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        Object.entries(columnMapping).forEach(([key, value]) => {
          if (value === header) {
            rowData[key] = row[index];
          }
        });
      });
      return rowData;
    });
  
    return processed;
  };

  return (
    <DataContext.Provider value={{
      uploadedFile,
      setUploadedFile,
      csvData,
      setCsvData,
      headers,
      setHeaders,
      columnMapping,
      setColumnMapping,
      detectionRules,
      setDetectionRules,
      resetData,
      getProcessedData,
      selectedModels,
      setSelectedModels,
      selectedFocus,
      setSelectedFocus
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 