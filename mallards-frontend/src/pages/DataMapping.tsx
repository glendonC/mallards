import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { 
  RequiredField, 
  ColumnMapping, 
  FeatureAvailability,
  AVAILABLE_FIELDS 
} from '../types/mapping';

const DataMapping: React.FC = () => {
  const navigate = useNavigate();
  const { customColors } = useTheme();
  const { headers, csvData, columnMapping, setColumnMapping } = useData();
  
  const [featureAvailability, setFeatureAvailability] = useState<FeatureAvailability[]>([]);

  // Update feature availability based on mapping
  useEffect(() => {
    const features: FeatureAvailability[] = [
      {
        key: 'temporalInsights',
        title: 'Temporal Pattern Analysis',
        available: !!columnMapping.transactionDate && !!columnMapping.transactionType,
        description: columnMapping.transactionDate && columnMapping.transactionType
          ? '✅ Full temporal pattern analysis enabled'
          : '⚠️ Temporal analysis limited - Missing required fields',
        requiredFields: ['transactionDate', 'transactionType']
      },
      {
        key: 'aiMonitoring',
        title: 'AI Decision Monitoring',
        available: !!columnMapping.approvalStatus && !!columnMapping.transactionDate,
        description: columnMapping.approvalStatus && columnMapping.transactionDate
          ? '✅ Full AI decision monitoring enabled'
          : '⚠️ Decision monitoring limited - Missing required fields',
        requiredFields: ['approvalStatus', 'transactionDate']
      },
      {
        key: 'regionalAnalysis',
        title: 'Regional Analysis',
        available: !!columnMapping.region,
        description: columnMapping.region
          ? '✅ Regional analysis enabled'
          : '⚠️ Using global analysis - Region data not available',
        requiredFields: ['region']
      },
      {
        key: 'transactionAnalysis',
        title: 'Transaction Pattern Analysis',
        available: !!columnMapping.transactionType && !!columnMapping.amount,
        description: columnMapping.transactionType && columnMapping.amount
          ? '✅ Full transaction pattern analysis enabled'
          : '⚠️ Pattern analysis limited - Missing required fields',
        requiredFields: ['amount', 'transactionType']
      }
    ];
    
    setFeatureAvailability(features);
  }, [columnMapping]);
  
  const handleMappingChange = (field: RequiredField, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  // Add preview table
  const renderPreview = () => {
    const previewRows = csvData.slice(0, 5); // Show first 5 rows

    return (
      <table className="min-w-full">
        <thead>
          <tr style={{ backgroundColor: customColors?.backgroundColor }}>
            {headers.map((header, index) => (
              <th 
                key={index}
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: customColors?.textColor }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: customColors?.borderColor }}>
          {previewRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex}
                  className="px-4 py-2 whitespace-nowrap text-sm"
                  style={{ color: customColors?.textColor }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: customColors?.textColor }}>
          Map Your Data
        </h1>
        <p className="text-lg mb-8 opacity-75" style={{ color: customColors?.textColor }}>
          Match your CSV columns to enable specific features
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Mapping and Preview */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Column Mapping Section */}
            <div className="bg-white rounded-lg p-6" style={{ 
              backgroundColor: customColors?.tileColor,
              borderColor: customColors?.borderColor 
            }}>
              <div className="grid gap-6">
                {AVAILABLE_FIELDS.map(field => (
                  <div key={field.key}>
                    <label className="block mb-2">
                      <span className="font-medium">{field.label}</span>
                      <span className="text-sm opacity-75 ml-2">({field.description})</span>
                      {field.required && (
                        <span className="text-sm ml-2 text-red-500">*Required</span>
                      )}
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border"
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      style={{ 
                        backgroundColor: customColors?.backgroundColor,
                        borderColor: customColors?.borderColor,
                        color: customColors?.textColor
                      }}
                    >
                      <option value="">Select a column</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-white rounded-lg p-6" style={{ 
              backgroundColor: customColors?.tileColor,
              borderColor: customColors?.borderColor 
            }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: customColors?.textColor }}>
                Data Preview
              </h3>
              <div className="overflow-x-auto">
                {csvData.length > 0 ? renderPreview() : (
                  <p className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                    No data to preview
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Feature Availability and Buttons */}
          <div className="w-full md:w-96 space-y-6">
            {/* Feature Availability */}
            <div className="bg-white rounded-lg p-6" style={{ 
              backgroundColor: customColors?.tileColor,
              borderColor: customColors?.borderColor
            }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: customColors?.textColor }}>
                Feature Availability
              </h3>
              <div className="space-y-4">
                {featureAvailability.map(feature => (
                  <div key={feature.key} className="flex items-start gap-2">
                    {feature.available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-medium" style={{ color: customColors?.textColor }}>
                        {feature.title}
                      </h4>
                      <p className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Aligned with Feature Availability */}
            <div className="flex justify-between items-center">
              <button
                className="px-4 py-2 rounded-lg border hover:bg-opacity-90"
                style={{ 
                  borderColor: customColors?.borderColor,
                  color: customColors?.textColor 
                }}
                onClick={() => navigate('/upload')}
              >
                Back to Upload
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
                onClick={() => navigate('/configure')}
                disabled={Object.values(columnMapping).every(value => !value)} // Only disabled if no fields are mapped
              >
                Continue to Configuration
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMapping; 