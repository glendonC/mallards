export type RequiredField = 
  | 'transactionDate'
  | 'amount'
  | 'transactionType'
  | 'culturalEvent'
  | 'culturalPeriod'
  | 'culturalGroup'
  | 'decisionDate'
  | 'decisionType'
  | 'approvalStatus'
  | 'region';

export interface ColumnMapping {
  [key: string]: string | undefined;
}

export interface FieldDefinition {
  key: RequiredField;
  label: string;
  description: string;
  required: boolean;
}

export interface FeatureAvailability {
  key: string;
  title: string;
  available: boolean;
  description: string;
  requiredFields: RequiredField[];
}

// Predefined available fields
export const AVAILABLE_FIELDS: FieldDefinition[] = [
    {
      key: 'transactionDate',
      label: 'Transaction Date',
      description: 'When the transaction occurred',
      required: false  // Changed to false
    },
    {
      key: 'amount',
      label: 'Amount',
      description: 'The value of the transaction',
      required: false  // Changed to false
    },
    {
      key: 'transactionType',
      label: 'Transaction Type',
      description: 'Category or type of transaction',
      required: false  // Changed to false
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      description: 'Whether the transaction was approved',
      required: false  // Changed to false
    },
    {
      key: 'region',
      label: 'Region/Location',
      description: 'Geographic location',
      required: false
    }
];