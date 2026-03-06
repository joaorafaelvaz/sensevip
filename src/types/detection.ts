export interface DetectionResult {
  id: string;
  customerId: string;
  timestamp: string;
  snapshotPath: string;
  expression: string;
  satisfactionTag: string;
  confidence: number;
  rawExpressions: Record<string, number>;
}

export interface LiveDetection {
  expression: string;
  satisfactionTag: string;
  confidence: number;
  timestamp: string;
  customerIsNew: boolean;
}

export interface DayStats {
  totalCustomers: number;
  satisfied: number;
  neutral: number;
  unsatisfied: number;
  avgConfidence: number;
  recentDetections: DetectionResult[];
}
