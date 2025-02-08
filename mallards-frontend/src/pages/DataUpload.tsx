import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileType, AlertCircle, Loader } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';

const DataUpload: React.FC = () => {
  const navigate = useNavigate();
  const { customColors } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUploadedFile, setCsvData, setHeaders } = useData();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setFile(file);

    try {
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        setUploadedFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            
            Papa.parse(text, {
              delimiter: ',',
              newline: '\n',
              quoteChar: '"',
              escapeChar: '"',
              header: false,
              skipEmptyLines: 'greedy',
              transformHeader: (header) => header.trim(),
              transform: (value) => value.trim(),
              complete: (results) => {
                if (results.errors.length > 0) {
                  setError(`CSV parsing error: ${results.errors[0].message}`);
                  setIsLoading(false);
                  return;
                }

                const data = results.data as string[][];
                if (data.length < 2) {
                  setError('File appears to be empty');
                  setIsLoading(false);
                  return;
                }

                // Only validate that we have headers and data
                const headers = data[0];
                if (headers.length === 0) {
                  setError('No columns found in CSV');
                  setIsLoading(false);
                  return;
                }

                setHeaders(data[0]);
                setCsvData(data.slice(1));
                setIsLoading(false);
              },
              error: (error: any) => {
                setError(`Error parsing CSV: ${error.message}`);
                setIsLoading(false);
              }
            });
          } catch (err) {
            setError('Error parsing CSV file. Please check the format.');
            setIsLoading(false);
          }
        };

        reader.onerror = () => {
          setError('Error reading file. Please try again.');
          setIsLoading(false);
        };

        reader.readAsText(file);
      } else {
        setError('Please upload a CSV file');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (file && !isLoading && !error) {
      navigate('/mapping');
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: customColors?.textColor }}>
          Upload Your Data
        </h1>
        <p className="text-lg mb-8 opacity-75" style={{ color: customColors?.textColor }}>
          Start by uploading your transaction dataset (CSV format)
        </p>

        {/* Upload Area */}
        <div 
          className={`
            border-2 border-dashed rounded-lg p-8 mb-6 text-center
            ${dragActive ? 'border-blue-500 bg-blue-50' : ''}
            ${error ? 'border-red-500' : ''}
          `}
          style={{ 
            borderColor: dragActive ? '#3B82F6' : error ? '#EF4444' : customColors?.borderColor,
            backgroundColor: customColors?.tileColor 
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileInput}
            id="file-upload"
            disabled={isLoading}
          />

          <label 
            htmlFor="file-upload"
            className={`flex flex-col items-center ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {isLoading ? (
              <>
                <Loader className="w-12 h-12 mb-4 animate-spin" style={{ color: customColors?.textColor }} />
                <span className="text-lg mb-2" style={{ color: customColors?.textColor }}>
                  Processing file...
                </span>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-4" style={{ color: customColors?.textColor }} />
                <span className="text-lg mb-2" style={{ color: customColors?.textColor }}>
                  {file ? file.name : 'Drag and drop your CSV file here'}
                </span>
                <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                  or click to browse
                </span>
              </>
            )}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-300 text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* File Requirements */}
        <div className="bg-white rounded-lg p-6 mb-6" style={{ 
          backgroundColor: customColors?.tileColor,
          borderColor: customColors?.borderColor 
        }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: customColors?.textColor }}>
            File Requirements
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2" style={{ color: customColors?.textColor }}>
              <FileType className="w-4 h-4" />
              CSV format only
            </li>
            <li className="flex items-center gap-2" style={{ color: customColors?.textColor }}>
              <AlertCircle className="w-4 h-4" />
              First row should contain column headers
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 rounded-lg border hover:bg-opacity-90"
            style={{ 
              borderColor: customColors?.borderColor,
              color: customColors?.textColor 
            }}
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
          >
            Skip for Now
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={!file || isLoading || !!error}
            onClick={handleContinue}
          >
            Continue to Mapping
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataUpload; 