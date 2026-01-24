// Last updated: 20th January 2025
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
];

export default function QueryDebugger() {
  const { user, loading, isAdmin, isAuditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'custom'>('select');
  const [executions, setExecutions] = useState<QueryExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<QueryExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
          const columns = selectMatch?.[1] || '*';
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
            queryBuilder = queryBuilder.order(col, { ascending: dir?.toUpperCase() !== 'DESC' });
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
    }
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  // Restrict access to admin and auditor only
  if (!isAdmin && !isAuditor) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need administrator or auditor privileges to access the query debugger.</CardDescription>
          </CardHeader>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Query Execution Debugger</h1>
          <p className="text-muted-foreground mt-2">
            Execute queries and view detailed execution breakdown, data flow, and backend information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Query Input</CardTitle>
            <CardDescription>Enter a SQL query or select a preset query to execute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select preset query" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_QUERIES.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute Query'}
              </Button>
              {executions.length > 0 && (
                <Button variant="outline" onClick={clearExecutions}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>
            <Textarea
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setQueryType(detectQueryType(e.target.value));
              }}
              placeholder="Enter SQL query (e.g., SELECT * FROM fraud_cases LIMIT 10)"
              className="font-mono text-sm min-h-[120px]"
            />
            <div className="flex items-center gap-2">
              <Badge variant="outline">Type: {queryType.toUpperCase()}</Badge>
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(query)}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {currentExecution && (
          <Card>
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
                  </CardDescription>
                </div>
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
                                <div className="flex items-center justify-between mb-2">
                                  <strong>Data:</strong>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(JSON.stringify(currentExecution.responseDetails?.data, null, 2))
                                    }
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy JSON
                                  </Button>
                                </div>
                                <ScrollArea className="h-[300px] border rounded p-2">
                                  <pre className="text-xs overflow-auto">
                                    {JSON.stringify(currentExecution.responseDetails.data, null, 2)}
                                  </pre>
                                </ScrollArea>
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
        )}

        {/* Execution History */}
        {executions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Previous query executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {executions.map((exec) => (
                    <div
                      key={exec.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setCurrentExecution(exec)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
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
                          </div>
                          <p className="text-sm font-mono truncate">{exec.query}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentExecution(exec);
                          }}
                        >
                          View Details
                        </Button>
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