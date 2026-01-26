// Last updated: 20th January 2025
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import {
  Play,
  Database,
  Clock,
  Network,
  FileCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  ArrowRight,
  Copy,
  Trash2,
  Download,
  Search,
  Star,
  StarOff,
  Filter,
  BarChart3,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  DownloadCloud,
  FileJson,
  FileSpreadsheet,
  Share2,
  History,
  TrendingDown,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExecutionStep {
  id: string;
  timestamp: number;
  step: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  data?: any;
  error?: string;
}

interface QueryExecution {
  id: string;
  query: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'custom';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'success' | 'error';
  steps: ExecutionStep[];
  requestDetails?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  responseDetails?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    error?: any;
  };
  networkInfo?: {
    requestSize: number;
    responseSize: number;
    transferTime: number;
  };
  backendSource: {
    type: 'supabase';
    url: string;
    table?: string;
    function?: string;
  };
}

const PRESET_QUERIES = [
  {
    name: 'Get All Cases',
    query: 'SELECT * FROM fraud_cases ORDER BY created_at DESC LIMIT 10',
    type: 'select' as const,
  },
  {
    name: 'Get All Transactions',
    query: 'SELECT * FROM transactions ORDER BY occurred_at DESC LIMIT 10',
    type: 'select' as const,
  },
  {
    name: 'Get Suspicious Transactions',
    query: 'SELECT * FROM suspicious_transactions ORDER BY flagged_at DESC LIMIT 10',
    type: 'select' as const,
  },
  {
    name: 'Get Users',
    query: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10',
    type: 'select' as const,
  },
  {
    name: 'Get Case Assignments',
    query: 'SELECT * FROM case_assignments ORDER BY assigned_at DESC LIMIT 10',
    type: 'select' as const,
  },
  {
    name: 'Get KPI Data',
    query: 'SELECT * FROM kpi_case_success',
    type: 'select' as const,
  },
  {
    name: 'Get Open Cases',
    query: 'SELECT * FROM fraud_cases WHERE status = \'OPEN\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get High Severity Cases',
    query: 'SELECT * FROM fraud_cases WHERE severity = \'HIGH\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Case History',
    query: 'SELECT * FROM case_history ORDER BY changed_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Evidence Files',
    query: 'SELECT * FROM evidence_files ORDER BY uploaded_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Investigators',
    query: 'SELECT * FROM investigators WHERE is_available = true ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Customers',
    query: 'SELECT * FROM customers ORDER BY created_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Audit Logs',
    query: 'SELECT * FROM audit_log ORDER BY acted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Fraud Rules',
    query: 'SELECT * FROM fraud_rules WHERE is_active = true ORDER BY rule_id',
    type: 'select' as const,
  },
  {
    name: 'Get Login Attempts',
    query: 'SELECT * FROM login_attempts ORDER BY attempted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Case Transactions',
    query: 'SELECT * FROM case_transactions ORDER BY created_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Assigned Investigator View',
    query: 'SELECT * FROM v_case_assigned_investigator ORDER BY assigned_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get High Risk Transactions',
    query: 'SELECT * FROM suspicious_transactions WHERE risk_level = \'HIGH\' ORDER BY risk_score DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Active Users',
    query: 'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Closed Cases',
    query: 'SELECT * FROM fraud_cases WHERE status = \'CLOSED\' ORDER BY closed_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Cases Under Investigation',
    query: 'SELECT * FROM fraud_cases WHERE status = \'UNDER_INVESTIGATION\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Medium Risk Transactions',
    query: 'SELECT * FROM suspicious_transactions WHERE risk_level = \'MEDIUM\' ORDER BY risk_score DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Low Risk Transactions',
    query: 'SELECT * FROM suspicious_transactions WHERE risk_level = \'LOW\' ORDER BY risk_score DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Payment Fraud Cases',
    query: 'SELECT * FROM fraud_cases WHERE category = \'PAYMENT_FRAUD\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Identity Theft Cases',
    query: 'SELECT * FROM fraud_cases WHERE category = \'IDENTITY_THEFT\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Account Takeover Cases',
    query: 'SELECT * FROM fraud_cases WHERE category = \'ACCOUNT_TAKEOVER\' ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Recent Transactions (Last 24h)',
    query: 'SELECT * FROM transactions WHERE occurred_at >= NOW() - INTERVAL \'24 hours\' ORDER BY occurred_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Failed Login Attempts',
    query: 'SELECT * FROM login_attempts WHERE success = false ORDER BY attempted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Locked Users',
    query: 'SELECT * FROM users WHERE is_locked = true ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Inactive Users',
    query: 'SELECT * FROM users WHERE is_active = false ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Unavailable Investigators',
    query: 'SELECT * FROM investigators WHERE is_available = false ORDER BY created_at DESC',
    type: 'select' as const,
  },
  {
    name: 'Get Inactive Fraud Rules',
    query: 'SELECT * FROM fraud_rules WHERE is_active = false ORDER BY rule_id',
    type: 'select' as const,
  },
  {
    name: 'Get Recent Audit Logs (INSERT)',
    query: 'SELECT * FROM audit_log WHERE action_type = \'INSERT\' ORDER BY acted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Recent Audit Logs (UPDATE)',
    query: 'SELECT * FROM audit_log WHERE action_type = \'UPDATE\' ORDER BY acted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Recent Audit Logs (DELETE)',
    query: 'SELECT * FROM audit_log WHERE action_type = \'DELETE\' ORDER BY acted_at DESC LIMIT 50',
    type: 'select' as const,
  },
  {
    name: 'Get Cases by Customer',
    query: 'SELECT fc.*, c.user_id, c.nid_number FROM fraud_cases fc JOIN customers c ON fc.customer_id = c.customer_id ORDER BY fc.created_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Transactions with Suspicious Info',
    query: 'SELECT t.*, st.risk_level, st.risk_score, st.reasons FROM transactions t JOIN suspicious_transactions st ON t.txn_id = st.txn_id ORDER BY st.risk_score DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Cases with Assignments',
    query: 'SELECT fc.*, ca.assigned_at, ca.investigator_id FROM fraud_cases fc LEFT JOIN case_assignments ca ON fc.case_id = ca.case_id ORDER BY fc.created_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get KPI Case Success View',
    query: 'SELECT * FROM kpi_case_success',
    type: 'select' as const,
  },
  {
    name: 'Get All Fraud Cases',
    query: 'SELECT case_id, title, status, severity, category, created_at FROM fraud_cases ORDER BY created_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get All Transactions',
    query: 'SELECT txn_id, txn_amount, txn_channel, txn_location, occurred_at FROM transactions ORDER BY occurred_at DESC LIMIT 20',
    type: 'select' as const,
  },
  {
    name: 'Get Top Risk Transactions',
    query: 'SELECT * FROM suspicious_transactions ORDER BY risk_score DESC LIMIT 10',
    type: 'select' as const,
  },
];

const AVAILABLE_TABLES = [
  'fraud_cases',
  'transactions',
  'suspicious_transactions',
  'users',
  'case_assignments',
  'case_history',
  'evidence_files',
  'investigators',
  'customers',
  'audit_log',
  'fraud_rules',
  'login_attempts',
  'case_transactions',
  'kpi_case_success',
  'v_case_assigned_investigator',
];

export default function QueryDebugger() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'custom'>('select');

  // Load query from URL parameter (when coming from Database Schema page)
  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam) {
      setQuery(decodeURIComponent(queryParam));
      setQueryType(detectQueryType(decodeURIComponent(queryParam)));
    }
  }, [searchParams]);
  const [executions, setExecutions] = useState<QueryExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<QueryExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const executionDetailsRef = useRef<HTMLDivElement>(null);
  
  // Query Builder State
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedColumns, setSelectedColumns] = useState('*');
  const [whereClause, setWhereClause] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [limitValue, setLimitValue] = useState('10');
  const [useQueryBuilder, setUseQueryBuilder] = useState(false);
  
  // Interactive Features State
  const [favoriteQueries, setFavoriteQueries] = useState<string[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'error'>('all');
  const [showTableView, setShowTableView] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Additional Interactive Features State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [resultSearch, setResultSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['steps']));
  const [queryValidation, setQueryValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [showQueryTips, setShowQueryTips] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [fullScreenMode, setFullScreenMode] = useState(false);

  const detectQueryType = (queryText: string): 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'custom' => {
    const trimmed = queryText.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'select';
    if (trimmed.startsWith('INSERT')) return 'insert';
    if (trimmed.startsWith('UPDATE')) return 'update';
    if (trimmed.startsWith('DELETE')) return 'delete';
    if (trimmed.includes('RPC') || trimmed.includes('CALL')) return 'rpc';
    return 'custom';
  };

  const extractTableName = (queryText: string): string | undefined => {
    const match = queryText.match(/FROM\s+(\w+)/i) || queryText.match(/INTO\s+(\w+)/i) || queryText.match(/UPDATE\s+(\w+)/i);
    return match?.[1];
  };

  const addStep = (execution: QueryExecution, step: Omit<ExecutionStep, 'id' | 'timestamp'>) => {
    const newStep: ExecutionStep = {
      ...step,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    execution.steps.push(newStep);
    setCurrentExecution({ ...execution });
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a query to execute',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    const executionId = `exec-${Date.now()}`;
    const detectedType = detectQueryType(query);
    const tableName = extractTableName(query);
    const startTime = performance.now();

    const execution: QueryExecution = {
      id: executionId,
      query: query.trim(),
      queryType: detectedType,
      startTime: Date.now(),
      status: 'running',
      steps: [],
      backendSource: {
        type: 'supabase',
        url: import.meta.env.VITE_SUPABASE_URL || 'N/A',
        table: tableName,
      },
    };

    setCurrentExecution(execution);
    setExecutions((prev) => [execution, ...prev]);

    try {
      // Step 1: Parse query
      addStep(execution, {
        step: '1. Query Parsing',
        description: `Detected query type: ${detectedType.toUpperCase()}`,
        status: 'success',
        duration: 0,
      });

      // Step 2: Prepare request
      addStep(execution, {
        step: '2. Request Preparation',
        description: 'Preparing Supabase API request',
        status: 'running',
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      execution.requestDetails = {
        url: `${supabaseUrl}/rest/v1/${tableName || 'rpc'}`,
        method: 'GET',
        headers: {
          'apikey': supabaseKey || '',
          'Authorization': `Bearer ${supabaseKey || ''}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      };

      addStep(execution, {
        step: '2. Request Preparation',
        description: `Request prepared for table: ${tableName || 'N/A'}`,
        status: 'success',
        duration: performance.now() - startTime,
        data: execution.requestDetails,
      });

      // Step 3: Execute query based on type
      addStep(execution, {
        step: '3. Query Execution',
        description: 'Executing query against Supabase backend',
        status: 'running',
      });

      const queryStartTime = performance.now();
      let result: any;
      let error: any = null;

      try {
        if (detectedType === 'select' && tableName) {
          // Parse SELECT query to extract columns and filters
          const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
          let columns = selectMatch?.[1] || '*';
          
          // Check for JOINs - PostgREST doesn't support them directly
          if (/\bJOIN\b/i.test(query)) {
            throw new Error(
              'JOIN queries are not supported. Use PostgREST embedding syntax instead. ' +
              'For example: select("*, case_assignments(assigned_at, investigator_id)") ' +
              'or query tables separately and combine results in JavaScript.'
            );
          }
          
          // Check for aggregate functions - these aren't supported in PostgREST .select()
          const aggregateFunctions = /\b(AVG|COUNT|SUM|MIN|MAX|GROUP BY)\s*\(/i;
          if (aggregateFunctions.test(columns) || /GROUP BY/i.test(query)) {
            throw new Error(
              'Aggregate functions (AVG, COUNT, SUM, MIN, MAX) and GROUP BY are not supported in direct queries. ' +
              'Use the kpi_case_success view for pre-calculated metrics, or fetch raw data and calculate in JavaScript.'
            );
          }
          
          // Strip table aliases from column names (e.g., "fc.*, ca.assigned_at" -> "*, assigned_at")
          if (columns !== '*' && columns.includes('.')) {
            columns = columns
              .split(',')
              .map(col => {
                const trimmed = col.trim();
                // Handle "table.*" -> "*"
                if (trimmed.match(/^\w+\.\*$/)) return '*';
                // Handle "table.column" -> "column"
                return trimmed.includes('.') ? trimmed.split('.').pop()! : trimmed;
              })
              .join(', ');
          }
          
          const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
          const orderMatch = query.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
          const limitMatch = query.match(/LIMIT\s+(\d+)/i);

          let queryBuilder = supabase.from(tableName as any).select(columns === '*' ? '*' : columns);

          if (whereMatch) {
            // Simple WHERE parsing (basic support)
            const whereClause = whereMatch[1];
            // This is simplified - in production, you'd want a proper SQL parser
            if (whereClause.includes('=')) {
              const [col, val] = whereClause.split('=').map((s) => s.trim());
              const cleanCol = col.replace(/['"]/g, '');
              const cleanVal = val.replace(/['"]/g, '');
              queryBuilder = (queryBuilder as any).eq(cleanCol, cleanVal);
            }
          }

          if (orderMatch) {
            const orderClause = orderMatch[1];
            const [col, dir] = orderClause.split(/\s+/);
            // Strip table alias prefix (e.g., "fc.created_at" -> "created_at")
            const cleanCol = col.includes('.') ? col.split('.').pop()! : col;
            queryBuilder = queryBuilder.order(cleanCol, { ascending: dir?.toUpperCase() !== 'DESC' });
          }

          if (limitMatch) {
            queryBuilder = queryBuilder.limit(parseInt(limitMatch[1]));
          }

          result = await queryBuilder;
        } else if (detectedType === 'rpc') {
          // For RPC calls, try to extract function name
          const funcMatch = query.match(/(?:CALL|SELECT)\s+(\w+)/i);
          const funcName = funcMatch?.[1];
          if (funcName) {
            execution.backendSource.function = funcName;
            result = await supabase.rpc(funcName as any, {});
          } else {
            throw new Error('Could not extract function name from RPC query');
          }
        } else {
          // For other query types, try to execute as raw SQL via RPC (if available)
          // Or show that direct SQL execution requires Supabase SQL Editor
          throw new Error(
            `${detectedType.toUpperCase()} queries require Supabase SQL Editor or RPC functions. Use SELECT queries for direct table access.`
          );
        }
      } catch (err: any) {
        error = err;
        result = { error: err };
      }

      const queryEndTime = performance.now();
      const queryDuration = queryEndTime - queryStartTime;

      // Step 4: Process response
      addStep(execution, {
        step: '4. Response Processing',
        description: error ? 'Error occurred during execution' : 'Processing response data',
        status: error ? 'error' : 'running',
        duration: queryDuration,
        error: error?.message,
      });

      if (error || result.error) {
        execution.status = 'error';
        execution.responseDetails = {
          status: 400,
          statusText: 'Error',
          headers: {},
          data: null,
          error: result.error || error,
        };

        addStep(execution, {
          step: '4. Response Processing',
          description: `Error: ${result.error?.message || error?.message}`,
          status: 'error',
          duration: queryDuration,
          error: result.error?.message || error?.message,
        });
      } else {
        execution.status = 'success';
        const responseData = result.data || [];
        const responseSize = JSON.stringify(responseData).length;

        execution.responseDetails = {
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json',
          },
          data: responseData,
        };

        execution.networkInfo = {
          requestSize: JSON.stringify(execution.requestDetails).length,
          responseSize: responseSize,
          transferTime: queryDuration,
        };

        addStep(execution, {
          step: '4. Response Processing',
          description: `Successfully retrieved ${Array.isArray(responseData) ? responseData.length : 1} record(s)`,
          status: 'success',
          duration: queryDuration,
          data: {
            recordCount: Array.isArray(responseData) ? responseData.length : 1,
            dataSize: responseSize,
          },
        });

        // Step 5: Data flow analysis
        addStep(execution, {
          step: '5. Data Flow Analysis',
          description: `Data retrieved from Supabase table: ${tableName || 'N/A'}`,
          status: 'success',
          data: {
            source: 'Supabase PostgreSQL Database',
            table: tableName,
            records: Array.isArray(responseData) ? responseData.length : 1,
            columns: Array.isArray(responseData) && responseData.length > 0 ? Object.keys(responseData[0]) : [],
          },
        });
      }

      const endTime = performance.now();
      execution.endTime = Date.now();
      execution.duration = endTime - startTime;

      setCurrentExecution(execution);
      setExecutions((prev) => prev.map((e) => (e.id === executionId ? execution : e)));
    } catch (err: any) {
      execution.status = 'error';
      execution.endTime = Date.now();
      execution.duration = performance.now() - startTime;

      addStep(execution, {
        step: 'Error',
        description: `Execution failed: ${err.message}`,
        status: 'error',
        error: err.message,
      });

      setCurrentExecution(execution);
      setExecutions((prev) => prev.map((e) => (e.id === executionId ? execution : e)));

      toast({
        title: 'Execution Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESET_QUERIES.find((p) => p.name === presetName);
    if (preset) {
      setQuery(preset.query);
      setQueryType(preset.type);
      setUseQueryBuilder(false);
    }
  };

  const buildQueryFromBuilder = () => {
    if (!selectedTable) {
      toast({
        title: 'Error',
        description: 'Please select a table',
        variant: 'destructive',
      });
      return;
    }

    let builtQuery = `SELECT ${selectedColumns} FROM ${selectedTable}`;
    
    if (whereClause.trim()) {
      builtQuery += ` WHERE ${whereClause}`;
    }
    
    if (orderBy.trim()) {
      builtQuery += ` ORDER BY ${orderBy} ${orderDirection}`;
    }
    
    if (limitValue && parseInt(limitValue) > 0) {
      builtQuery += ` LIMIT ${limitValue}`;
    }

    setQuery(builtQuery);
    setQueryType('select');
  };

  const loadTableIntoBuilder = (tableName: string) => {
    setSelectedTable(tableName);
    setSelectedColumns('*');
    setWhereClause('');
    setOrderBy('');
    setOrderDirection('DESC');
    setLimitValue('10');
    setUseQueryBuilder(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  const clearExecutions = () => {
    setExecutions([]);
    setCurrentExecution(null);
  };

  // Export Functions
  const exportToJSON = () => {
    if (!currentExecution?.responseDetails?.data) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }
    const dataStr = JSON.stringify(currentExecution.responseDetails.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported',
      description: 'Data exported to JSON file',
    });
  };

  const exportToCSV = () => {
    if (!currentExecution?.responseDetails?.data || !Array.isArray(currentExecution.responseDetails.data)) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }
    const data = currentExecution.responseDetails.data;
    if (data.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ];
    const csvContent = csvRows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported',
      description: 'Data exported to CSV file',
    });
  };

  // Favorite Queries Functions
  const toggleFavorite = (query: string) => {
    setFavoriteQueries(prev => {
      if (prev.includes(query)) {
        return prev.filter(q => q !== query);
      } else {
        return [...prev, query];
      }
    });
  };

  const isFavorite = (query: string) => favoriteQueries.includes(query);

  // Filter and Search Functions
  const filteredExecutions = executions.filter(exec => {
    const matchesSearch = exec.query.toLowerCase().includes(historySearch.toLowerCase());
    const matchesFilter = historyFilter === 'all' || exec.status === historyFilter;
    return matchesSearch && matchesFilter;
  });

  // Sort Functions
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortedData = (data: any[]) => {
    if (!sortConfig || !Array.isArray(data) || data.length === 0) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  };

  // Performance Statistics
  const getPerformanceStats = () => {
    const successful = executions.filter(e => e.status === 'success');
    const avgDuration = successful.length > 0
      ? successful.reduce((sum, e) => sum + (e.duration || 0), 0) / successful.length
      : 0;
    const totalQueries = executions.length;
    const successRate = totalQueries > 0
      ? (successful.length / totalQueries) * 100
      : 0;
    return { avgDuration, totalQueries, successRate, successfulCount: successful.length };
  };

  const performanceStats = getPerformanceStats();

  // Query Validation
  const validateQuery = (queryText: string): { valid: boolean; message: string } => {
    if (!queryText.trim()) {
      return { valid: false, message: 'Query cannot be empty' };
    }
    const trimmed = queryText.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('INSERT') && 
        !trimmed.startsWith('UPDATE') && !trimmed.startsWith('DELETE') &&
        !trimmed.includes('RPC') && !trimmed.includes('CALL')) {
      return { valid: false, message: 'Query must start with SELECT, INSERT, UPDATE, DELETE, or be an RPC call' };
    }
    if (trimmed.startsWith('SELECT') && !trimmed.includes('FROM')) {
      return { valid: false, message: 'SELECT queries must include a FROM clause' };
    }
    return { valid: true, message: 'Query is valid' };
  };

  // Toggle Section Expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Share Query Function
  const shareQuery = () => {
    if (!query.trim()) {
      toast({
        title: 'No Query',
        description: 'Please enter a query to share',
        variant: 'destructive',
      });
      return;
    }
    const shareData = {
      query: query,
      timestamp: new Date().toISOString(),
    };
    const shareText = `Query: ${query}\n\nShared from Query Debugger at ${new Date().toLocaleString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'SQL Query',
        text: shareText,
      }).catch(() => {
        copyToClipboard(shareText);
        toast({
          title: 'Copied',
          description: 'Query copied to clipboard (Share API not available)',
        });
      });
    } else {
      copyToClipboard(shareText);
      toast({
        title: 'Copied',
        description: 'Query copied to clipboard',
      });
    }
  };

  // Pagination Functions
  const getPaginatedData = (data: any[]) => {
    if (!Array.isArray(data)) return [];
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = currentExecution?.responseDetails?.data && Array.isArray(currentExecution.responseDetails.data)
    ? Math.ceil(currentExecution.responseDetails.data.length / rowsPerPage)
    : 1;

  // Result Search/Filter
  const getFilteredResults = (data: any[]) => {
    if (!Array.isArray(data) || !resultSearch) return data;
    return data.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(resultSearch.toLowerCase())
      );
    });
  };

  // Query Tips
  const queryTips = [
    'Use LIMIT to restrict the number of rows returned',
    'Always use WHERE clauses for better performance',
    'Use ORDER BY to sort results',
    'Check table names in the query builder dropdown',
    'Use JOIN for combining data from multiple tables',
    'Use aggregate functions (COUNT, SUM, AVG) for statistics',
    'Use GROUP BY with aggregate functions',
    'Use DISTINCT to remove duplicate rows',
  ];


  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Query Execution Debugger</h1>
          <p className="text-muted-foreground mt-2">
            Execute queries and view detailed execution breakdown, data flow, and backend information
          </p>
        </div>

        {/* Performance Statistics Dashboard */}
        {executions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Queries</span>
                  </div>
                  <div className="text-2xl font-bold">{performanceStats.totalQueries}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{performanceStats.successRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {performanceStats.successfulCount} successful
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Avg Duration</span>
                  </div>
                  <div className="text-2xl font-bold">{performanceStats.avgDuration.toFixed(2)}ms</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Error Rate</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {((executions.length - performanceStats.successfulCount) / executions.length * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {executions.length - performanceStats.successfulCount} errors
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Favorite Queries Section */}
        {favoriteQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Favorite Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {favoriteQueries.map((favQuery, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                    <code className="text-xs font-mono max-w-[300px] truncate">{favQuery}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuery(favQuery);
                        setQueryType(detectQueryType(favQuery));
                        setUseQueryBuilder(false);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(favQuery)}
                    >
                      <StarOff className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Query Input</CardTitle>
            <CardDescription>Enter a SQL query, use the query builder, or select a preset query to execute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={useQueryBuilder ? 'builder' : 'manual'} onValueChange={(v) => setUseQueryBuilder(v === 'builder')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual SQL</TabsTrigger>
                <TabsTrigger value="builder">Query Builder</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Select onValueChange={handlePresetSelect}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select preset query" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quick Queries</div>
                      {PRESET_QUERIES.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => {
                      const validation = validateQuery(query);
                      setQueryValidation(validation);
                      if (validation.valid) {
                        executeQuery();
                        setQueryHistory(prev => {
                          if (!prev.includes(query.trim())) {
                            return [query.trim(), ...prev].slice(0, 20);
                          }
                          return prev;
                        });
                      } else {
                        toast({
                          title: 'Query Validation Failed',
                          description: validation.message,
                          variant: 'destructive',
                        });
                      }
                    }} 
                    disabled={isExecuting || !query.trim()}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isExecuting ? 'Executing...' : 'Execute Query'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareQuery}
                    disabled={!query.trim()}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQueryTips(!showQueryTips)}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Tips
                  </Button>
                  {executions.length > 0 && (
                    <Button variant="outline" onClick={clearExecutions}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setQueryType('select');
                      setQueryValidation(null);
                    }}
                  >
                    Clear Query
                  </Button>
                </div>

                {/* Query Validation Message */}
                {queryValidation && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    queryValidation.valid 
                      ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                      : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}>
                    {queryValidation.valid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{queryValidation.message}</span>
                  </div>
                )}

                {/* Query Tips Panel */}
                {showQueryTips && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Query Tips & Best Practices
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQueryTips(false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {queryTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Query History Dropdown */}
                {queryHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Recent Queries</Label>
                    </div>
                    <Select onValueChange={(value) => {
                      setQuery(value);
                      setQueryType(detectQueryType(value));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from recent queries" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {queryHistory.map((histQuery, idx) => (
                          <SelectItem key={idx} value={histQuery}>
                            <code className="text-xs font-mono max-w-[400px] truncate block">{histQuery}</code>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Quick Query Templates */}
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground self-center">Quick Templates:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM fraud_cases LIMIT 10')}
                    className="h-7 text-xs"
                  >
                    Cases
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM transactions LIMIT 10')}
                    className="h-7 text-xs"
                  >
                    Transactions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM users LIMIT 10')}
                    className="h-7 text-xs"
                  >
                    Users
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM suspicious_transactions ORDER BY risk_score DESC LIMIT 10')}
                    className="h-7 text-xs"
                  >
                    Suspicious
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM audit_log ORDER BY acted_at DESC LIMIT 20')}
                    className="h-7 text-xs"
                  >
                    Audit Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery('SELECT * FROM case_assignments ORDER BY assigned_at DESC LIMIT 10')}
                    className="h-7 text-xs"
                  >
                    Assignments
                  </Button>
                </div>

                <Textarea
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setQueryType(detectQueryType(e.target.value));
                  }}
                  placeholder="Enter SQL query (e.g., SELECT * FROM fraud_cases LIMIT 10) or use templates above"
                  className="font-mono text-sm min-h-[150px]"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">Type: {queryType.toUpperCase()}</Badge>
                  {query && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(query)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Query
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuery(query.trim() + ';');
                        }}
                        className="h-6 px-2"
                      >
                        Add Semicolon
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(query)}
                        className="h-6 px-2"
                      >
                        {isFavorite(query) ? (
                          <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <Star className="h-3 w-3 mr-1" />
                        )}
                        {isFavorite(query) ? 'Unfavorite' : 'Favorite'}
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="builder" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-select">Table</Label>
                    <Select value={selectedTable} onValueChange={loadTableIntoBuilder}>
                      <SelectTrigger id="table-select">
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {AVAILABLE_TABLES.map((table) => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columns-input">Columns (comma-separated or *)</Label>
                    <Input
                      id="columns-input"
                      value={selectedColumns}
                      onChange={(e) => setSelectedColumns(e.target.value)}
                      placeholder="* or column1, column2, ..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="where-input">WHERE Clause</Label>
                    <Input
                      id="where-input"
                      value={whereClause}
                      onChange={(e) => setWhereClause(e.target.value)}
                      placeholder="status = 'OPEN' AND severity = 'HIGH'"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderby-input">ORDER BY Column</Label>
                    <Input
                      id="orderby-input"
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      placeholder="created_at"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order-direction">Order Direction</Label>
                    <Select value={orderDirection} onValueChange={(v: 'ASC' | 'DESC') => setOrderDirection(v)}>
                      <SelectTrigger id="order-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">ASC (Ascending)</SelectItem>
                        <SelectItem value="DESC">DESC (Descending)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit-input">LIMIT</Label>
                    <Input
                      id="limit-input"
                      type="number"
                      value={limitValue}
                      onChange={(e) => setLimitValue(e.target.value)}
                      placeholder="10"
                      min="1"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={buildQueryFromBuilder} disabled={!selectedTable}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Build Query
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedTable('');
                    setSelectedColumns('*');
                    setWhereClause('');
                    setOrderBy('');
                    setOrderDirection('DESC');
                    setLimitValue('10');
                  }}>
                    Clear Builder
                  </Button>
                  {query && (
                    <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                      <Play className="h-4 w-4 mr-2" />
                      {isExecuting ? 'Executing...' : 'Execute Query'}
                    </Button>
                  )}
                </div>

                {query && (
                  <div className="space-y-2">
                    <Label>Generated Query:</Label>
                    <Textarea
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setQueryType(detectQueryType(e.target.value));
                      }}
                      className="font-mono text-sm min-h-[80px]"
                      readOnly={false}
                    />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Type: {queryType.toUpperCase()}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(query)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Query
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {currentExecution && (
          <div ref={executionDetailsRef} id="execution-details-section" className="scroll-mt-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Execution Details
                      <Badge
                        variant={
                          currentExecution.status === 'success'
                            ? 'default'
                            : currentExecution.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {currentExecution.status.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {currentExecution.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Duration: {currentExecution.duration.toFixed(2)}ms
                        </span>
                      )}
                      {currentExecution.endTime && (
                        <span className="flex items-center gap-1 ml-3">
                          Executed: {new Date(currentExecution.endTime).toLocaleString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentExecution(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
            <CardContent>
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="steps">Execution Steps</TabsTrigger>
                  <TabsTrigger value="request">Request Details</TabsTrigger>
                  <TabsTrigger value="response">Response Data</TabsTrigger>
                  <TabsTrigger value="backend">Backend Source</TabsTrigger>
                </TabsList>

                <TabsContent value="steps" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {currentExecution.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {step.status === 'success' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {step.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {step.status === 'running' && (
                                <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                              )}
                              {step.status === 'pending' && (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="font-semibold">{step.step}</span>
                            </div>
                            {step.duration !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {step.duration.toFixed(2)}ms
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.error && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-700 dark:text-red-300">
                              <strong>Error:</strong> {step.error}
                            </div>
                          )}
                          {step.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                                View Data
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                {JSON.stringify(step.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="request" className="mt-4">
                  <div className="space-y-4">
                    {currentExecution.requestDetails && (
                      <>
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Request Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>URL:</strong>{' '}
                              <code className="bg-muted px-2 py-1 rounded">{currentExecution.requestDetails.url}</code>
                            </div>
                            <div>
                              <strong>Method:</strong>{' '}
                              <Badge variant="outline">{currentExecution.requestDetails.method}</Badge>
                            </div>
                            <div>
                              <strong>Headers:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(currentExecution.requestDetails.headers, null, 2)}
                              </pre>
                            </div>
                            {currentExecution.requestDetails.body && (
                              <div>
                                <strong>Body:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(currentExecution.requestDetails.body, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                        {currentExecution.networkInfo && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Network Information
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                <strong>Request Size:</strong> {currentExecution.networkInfo.requestSize} bytes
                              </div>
                              <div>
                                <strong>Response Size:</strong> {currentExecution.networkInfo.responseSize} bytes
                              </div>
                              <div>
                                <strong>Transfer Time:</strong> {currentExecution.networkInfo.transferTime.toFixed(2)}ms
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="response" className="mt-4">
                  <div className="space-y-4">
                    {currentExecution.responseDetails && (
                      <>
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            {currentExecution.responseDetails.status === 200 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            Response Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Status:</strong>{' '}
                              <Badge
                                variant={currentExecution.responseDetails.status === 200 ? 'default' : 'destructive'}
                              >
                                {currentExecution.responseDetails.status} {currentExecution.responseDetails.statusText}
                              </Badge>
                            </div>
                            {currentExecution.responseDetails.headers && (
                              <div>
                                <strong>Headers:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(currentExecution.responseDetails.headers, null, 2)}
                                </pre>
                              </div>
                            )}
                            {currentExecution.responseDetails.error && (
                              <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                                <strong>Error:</strong>
                                <pre className="mt-1 text-xs overflow-auto">
                                  {JSON.stringify(currentExecution.responseDetails.error, null, 2)}
                                </pre>
                              </div>
                            )}
                            {currentExecution.responseDetails.data && (
                              <div>
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <strong>Data:</strong>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(JSON.stringify(currentExecution.responseDetails?.data, null, 2))
                                      }
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy JSON
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={exportToJSON}
                                    >
                                      <FileJson className="h-3 w-3 mr-1" />
                                      Export JSON
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={exportToCSV}
                                    >
                                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                                      Export CSV
                                    </Button>
                                    <div className="flex items-center gap-2 px-2">
                                      <Switch
                                        checked={showTableView}
                                        onCheckedChange={setShowTableView}
                                        id="table-view"
                                      />
                                      <Label htmlFor="table-view" className="text-xs cursor-pointer">
                                        Table View
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                                
                                {showTableView && Array.isArray(currentExecution.responseDetails.data) && currentExecution.responseDetails.data.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="border rounded">
                                      <ScrollArea className={fullScreenMode ? "h-[600px]" : "h-[400px]"}>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            {Object.keys(currentExecution.responseDetails.data[0]).map((key) => (
                                              <TableHead
                                                key={key}
                                                className="cursor-pointer hover:bg-muted"
                                                onClick={() => handleSort(key)}
                                              >
                                                <div className="flex items-center gap-1">
                                                  {key}
                                                  {sortConfig?.key === key && (
                                                    <span className="text-xs">
                                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                  )}
                                                </div>
                                              </TableHead>
                                            ))}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {getPaginatedData(getFilteredResults(getSortedData(currentExecution.responseDetails.data))).map((row, idx) => (
                                            <TableRow key={idx}>
                                              {Object.keys(currentExecution.responseDetails.data[0]).map((key) => (
                                                <TableCell key={key} className="max-w-[200px] truncate" title={String(row[key] ?? '')}>
                                                  {typeof row[key] === 'object' 
                                                    ? JSON.stringify(row[key])
                                                    : String(row[key] ?? '')}
                                                </TableCell>
                                              ))}
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                      </ScrollArea>
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs">Rows per page:</Label>
                                          <Select value={String(rowsPerPage)} onValueChange={(v) => {
                                            setRowsPerPage(Number(v));
                                            setCurrentPage(1);
                                          }}>
                                            <SelectTrigger className="w-[80px] h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="10">10</SelectItem>
                                              <SelectItem value="25">25</SelectItem>
                                              <SelectItem value="50">50</SelectItem>
                                              <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                          >
                                            <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <span className="text-sm">
                                            Page {currentPage} of {totalPages}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-muted-foreground">
                                      Showing {getFilteredResults(currentExecution.responseDetails.data).length} of {currentExecution.responseDetails.data.length} row(s). 
                                      {resultSearch && ` Filtered by: "${resultSearch}"`}
                                      {sortConfig && ` Sorted by: ${sortConfig.key} (${sortConfig.direction})`}
                                      {!resultSearch && !sortConfig && ' Click column headers to sort.'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border rounded">
                                    <ScrollArea className="h-[300px] p-2">
                                      <pre className="text-xs overflow-auto">
                                        {JSON.stringify(currentExecution.responseDetails.data, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="backend" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Backend Source
                      </h4>
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="h-4 w-4" />
                            <strong>Source Type:</strong>
                            <Badge>{currentExecution.backendSource.type.toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <strong>Backend URL:</strong>{' '}
                              <code className="bg-muted px-2 py-1 rounded">
                                {currentExecution.backendSource.url}
                              </code>
                            </div>
                            {currentExecution.backendSource.table && (
                              <div>
                                <strong>Table:</strong>{' '}
                                <Badge variant="outline">{currentExecution.backendSource.table}</Badge>
                              </div>
                            )}
                            {currentExecution.backendSource.function && (
                              <div>
                                <strong>Function:</strong>{' '}
                                <Badge variant="outline">{currentExecution.backendSource.function}</Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Data Flow Information */}
                        {currentExecution.responseDetails?.data && (
                          <div className="p-4 border rounded-lg">
                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                              <FileCode className="h-4 w-4" />
                              Data Flow Breakdown
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>
                                  <strong>Step 1:</strong> Query received and parsed
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>
                                  <strong>Step 2:</strong> Request prepared for{' '}
                                  {currentExecution.backendSource.table || currentExecution.backendSource.function || 'backend'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>
                                  <strong>Step 3:</strong> Query executed against Supabase PostgreSQL database
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>
                                  <strong>Step 4:</strong> Data retrieved from{' '}
                                  {currentExecution.backendSource.table
                                    ? `table "${currentExecution.backendSource.table}"`
                                    : currentExecution.backendSource.function
                                      ? `function "${currentExecution.backendSource.function}"`
                                      : 'backend'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span>
                                  <strong>Step 5:</strong> Response processed and returned to frontend
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Execution Summary */}
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <h5 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Execution Summary
                          </h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Query Type:</strong>{' '}
                              <Badge variant="outline">{currentExecution.queryType.toUpperCase()}</Badge>
                            </div>
                            <div>
                              <strong>Status:</strong>{' '}
                              <Badge
                                variant={
                                  currentExecution.status === 'success'
                                    ? 'default'
                                    : currentExecution.status === 'error'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {currentExecution.status.toUpperCase()}
                              </Badge>
                            </div>
                            {currentExecution.duration && (
                              <div>
                                <strong>Total Duration:</strong> {currentExecution.duration.toFixed(2)}ms
                              </div>
                            )}
                            {currentExecution.responseDetails?.data && (
                              <div>
                                <strong>Records Returned:</strong>{' '}
                                {Array.isArray(currentExecution.responseDetails.data)
                                  ? currentExecution.responseDetails.data.length
                                  : 1}
                              </div>
                            )}
                            {currentExecution.networkInfo && (
                              <>
                                <div>
                                  <strong>Request Size:</strong> {currentExecution.networkInfo.requestSize} bytes
                                </div>
                                <div>
                                  <strong>Response Size:</strong> {currentExecution.networkInfo.responseSize} bytes
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            </Card>
          </div>
        )}

        {/* Execution History */}
        {executions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Execution History</CardTitle>
                  <CardDescription>Previous query executions ({filteredExecutions.length} of {executions.length})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={historyFilter} onValueChange={(v: 'all' | 'success' | 'error') => setHistoryFilter(v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success Only</SelectItem>
                    <SelectItem value="error">Errors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant={
                                exec.status === 'success'
                                  ? 'default'
                                  : exec.status === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {exec.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{exec.queryType.toUpperCase()}</Badge>
                            {exec.duration && (
                              <span className="text-xs text-muted-foreground">
                                {exec.duration.toFixed(2)}ms
                              </span>
                            )}
                            {exec.responseDetails?.data && Array.isArray(exec.responseDetails.data) && (
                              <span className="text-xs text-muted-foreground">
                                {exec.responseDetails.data.length} rows
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-mono truncate mb-2">{exec.query}</p>
                          {exec.endTime && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(exec.endTime).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentExecution(exec);
                              // Scroll to execution details section with a slight delay to ensure DOM is updated
                              setTimeout(() => {
                                const element = document.getElementById('execution-details-section');
                                if (element) {
                                  element.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start',
                                    inline: 'nearest'
                                  });
                                  // Add a highlight effect
                                  const card = element.querySelector('.border-2');
                                  if (card) {
                                    (card as HTMLElement).style.transition = 'box-shadow 0.3s, border-color 0.3s';
                                    (card as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
                                    (card as HTMLElement).style.borderColor = 'rgb(59, 130, 246)';
                                    setTimeout(() => {
                                      if (card) {
                                        (card as HTMLElement).style.boxShadow = '';
                                        (card as HTMLElement).style.borderColor = '';
                                      }
                                    }, 2000);
                                  }
                                } else if (executionDetailsRef.current) {
                                  // Fallback to ref if ID doesn't work
                                  executionDetailsRef.current.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start',
                                    inline: 'nearest'
                                  });
                                }
                              }, 200);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuery(exec.query);
                              setQueryType(exec.queryType);
                              setUseQueryBuilder(false);
                              toast({
                                title: 'Query Loaded',
                                description: 'Query loaded into input. Click Execute to run it again.',
                              });
                            }}
                          >
                            Re-run
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}