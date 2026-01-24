// Last updated: 20th January 2025
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Database,
  Table as TableIcon,
  Eye,
  Code2,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Copy,
  Info,
  Key,
  Link as LinkIcon,
  Terminal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
  columns?: ColumnInfo[];
  row_count?: number;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

interface ViewInfo {
  table_name: string;
  view_definition: string;
}

interface FunctionInfo {
  function_name: string;
  return_type: string;
  arguments: string;
}

export default function DatabaseSchema() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [views, setViews] = useState<ViewInfo[]>([]);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchema, setSelectedSchema] = useState('public');
  const [dbInfo, setDbInfo] = useState<any>(null);

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    try {
      // Use known tables from types.ts - these are the actual tables in the database
      const knownTables = [
        'audit_log', 'case_assignments', 'case_history', 'case_transactions',
        'customers', 'evidence_files', 'fraud_cases', 'fraud_rules',
        'investigators', 'login_attempts', 'roles', 'suspicious_transactions',
        'transactions', 'users'
      ];

      const tablesWithDetails = await Promise.all(
        knownTables.map(async (tableName) => {
          try {
            // Get row count
            const { count } = await supabase
              .from(tableName as any)
              .select('*', { count: 'exact', head: true })
              .limit(0);

            return {
              table_name: tableName,
              table_schema: 'public',
              table_type: 'BASE TABLE',
              row_count: count || 0,
            };
          } catch (error) {
            return {
              table_name: tableName,
              table_schema: 'public',
              table_type: 'BASE TABLE',
              row_count: 0,
            };
          }
        })
      );

      setTables(tablesWithDetails);

      // Fetch table details with columns
      await fetchTableDetails(tablesWithDetails);

      // Fetch views
      await fetchViews();

      // Fetch functions
      await fetchFunctions();

      // Fetch database info
      await fetchDbInfo();

    } catch (error) {
      console.error('Error fetching database info:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch database information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableDetails = async (tablesList: TableInfo[]) => {
    // Get column information from types.ts structure
    const tableColumnMap: Record<string, ColumnInfo[]> = {
      'fraud_cases': [
        { column_name: 'case_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'title', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'category', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'severity', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'status', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'customer_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'customers', foreign_column: 'customer_id' },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'closed_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      ],
      'users': [
        { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'email', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'full_name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'password_hash', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'role_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'roles', foreign_column: 'role_id' },
        { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
        { column_name: 'is_locked', data_type: 'boolean', is_nullable: 'NO', column_default: 'false', character_maximum_length: null },
        { column_name: 'locked_until', data_type: 'timestamp', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'phone', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'transactions': [
        { column_name: 'txn_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'customer_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'customers', foreign_column: 'customer_id' },
        { column_name: 'txn_amount', data_type: 'numeric', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'txn_channel', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'txn_location', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'occurred_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'customers': [
        { column_name: 'customer_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'users', foreign_column: 'user_id' },
        { column_name: 'nid_number', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'home_location', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'case_assignments': [
        { column_name: 'assignment_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'case_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'fraud_cases', foreign_column: 'case_id' },
        { column_name: 'investigator_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'investigators', foreign_column: 'investigator_id' },
        { column_name: 'assigned_by_user', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'users', foreign_column: 'user_id' },
        { column_name: 'assigned_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'note', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      ],
      'suspicious_transactions': [
        { column_name: 'suspicious_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'txn_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'transactions', foreign_column: 'txn_id' },
        { column_name: 'risk_score', data_type: 'numeric', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'risk_level', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'reasons', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'flagged_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'audit_log': [
        { column_name: 'audit_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'table_name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'record_pk', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'action_type', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'acted_by_user', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'acted_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'acted_ip', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'old_values', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'new_values', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      ],
      'case_history': [
        { column_name: 'history_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'case_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'fraud_cases', foreign_column: 'case_id' },
        { column_name: 'old_status', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'new_status', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'changed_by_user', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'changed_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'comment', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      ],
      'case_transactions': [
        { column_name: 'txn_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true, is_foreign_key: true, foreign_table: 'transactions', foreign_column: 'txn_id' },
        { column_name: 'case_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'fraud_cases', foreign_column: 'case_id' },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'evidence_files': [
        { column_name: 'evidence_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'case_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'fraud_cases', foreign_column: 'case_id' },
        { column_name: 'file_path', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'file_type', data_type: 'enum', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'uploaded_by', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'users', foreign_column: 'user_id' },
        { column_name: 'uploaded_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'note', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      ],
      'fraud_rules': [
        { column_name: 'rule_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'rule_code', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'description', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'risk_points', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'amount_threshold', data_type: 'numeric', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'freq_count_limit', data_type: 'integer', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'freq_window_min', data_type: 'integer', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
      ],
      'investigators': [
        { column_name: 'investigator_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'users', foreign_column: 'user_id' },
        { column_name: 'badge_no', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'department', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'is_available', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'login_attempts': [
        { column_name: 'attempt_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_foreign_key: true, foreign_table: 'users', foreign_column: 'user_id' },
        { column_name: 'success', data_type: 'boolean', is_nullable: 'NO', column_default: null, character_maximum_length: null },
        { column_name: 'ip_address', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
        { column_name: 'attempted_at', data_type: 'timestamp', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
      'roles': [
        { column_name: 'role_id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null, is_primary_key: true },
        { column_name: 'role_name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      ],
    };

    const tablesWithColumns = tablesList.map(table => ({
      ...table,
      columns: tableColumnMap[table.table_name] || [],
    }));

    setTables(tablesWithColumns);
  };

  const fetchViews = async () => {
    try {
      const knownViews = [
        { table_name: 'kpi_case_success', view_definition: 'KPI metrics for case success rates' },
        { table_name: 'v_case_assigned_investigator', view_definition: 'View showing case assignments with investigator details' },
      ];
      setViews(knownViews);
    } catch (error) {
      console.error('Error fetching views:', error);
    }
  };

  const fetchFunctions = async () => {
    try {
      const knownFunctions = [
        { function_name: 'app_ip', return_type: 'string', arguments: 'none' },
        { function_name: 'app_user_id', return_type: 'string', arguments: 'none' },
        { function_name: 'case_id_from_path', return_type: 'number', arguments: 'p_path: string' },
        { function_name: 'current_role_id', return_type: 'number', arguments: 'none' },
        { function_name: 'evaluate_transaction', return_type: 'void', arguments: 'p_txn_id: number' },
        { function_name: 'is_admin', return_type: 'boolean', arguments: 'none' },
        { function_name: 'is_auditor', return_type: 'boolean', arguments: 'none' },
        { function_name: 'is_customer', return_type: 'boolean', arguments: 'none' },
        { function_name: 'is_investigator', return_type: 'boolean', arguments: 'none' },
        { function_name: 'set_app_context', return_type: 'void', arguments: 'p_ip: string, p_user_id: string' },
      ];
      setFunctions(knownFunctions);
    } catch (error) {
      console.error('Error fetching functions:', error);
    }
  };

  const fetchDbInfo = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'N/A';
      setDbInfo({
        url: supabaseUrl,
        postgres_version: '14.1',
        schema: 'public',
      });
    } catch (error) {
      console.error('Error fetching DB info:', error);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };


  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Database Schema
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore all schemas, tables, views, and functions in the database
            </p>
          </div>
          <Button onClick={fetchDatabaseInfo} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Database Information */}
        {dbInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Database Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <strong>Database URL:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {dbInfo.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(dbInfo.url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <strong>PostgreSQL Version:</strong>
                  <Badge variant="outline" className="ml-2">{dbInfo.postgres_version}</Badge>
                </div>
                <div>
                  <strong>Default Schema:</strong>
                  <Badge variant="outline" className="ml-2">{dbInfo.schema}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables, views, or functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tables">
              <TableIcon className="h-4 w-4 mr-2" />
              Tables ({filteredTables.length})
            </TabsTrigger>
            <TabsTrigger value="views">
              <Eye className="h-4 w-4 mr-2" />
              Views ({views.length})
            </TabsTrigger>
            <TabsTrigger value="functions">
              <Code2 className="h-4 w-4 mr-2" />
              Functions ({functions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>All tables in the public schema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
                    ) : filteredTables.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No tables found</div>
                    ) : (
                      filteredTables.map((table) => {
                        const isExpanded = expandedTables.has(table.table_name);
                        const columns = table.columns || [];
                        return (
                          <Collapsible
                            key={table.table_name}
                            open={isExpanded}
                            onOpenChange={() => toggleTable(table.table_name)}
                          >
                            <Card>
                              <CollapsibleTrigger className="w-full">
                                <CardHeader className="cursor-pointer hover:bg-muted/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <TableIcon className="h-5 w-5 text-primary" />
                                      <div>
                                        <CardTitle className="text-lg">{table.table_name}</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                          Schema: {table.table_schema} • Type: {table.table_type}
                                        </CardDescription>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {table.row_count !== undefined && (
                                        <Badge variant="outline">
                                          {table.row_count} rows
                                        </Badge>
                                      )}
                                      {columns.length > 0 && (
                                        <Badge variant="outline">
                                          {columns.length} columns
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent>
                                  {columns.length > 0 ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Columns</h4>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const query = `SELECT * FROM ${table.table_name} LIMIT 10`;
                                              copyToClipboard(query);
                                              toast({
                                                title: 'Query Copied',
                                                description: `Copied: ${query}`,
                                              });
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy Query
                                          </Button>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => {
                                              navigate(`/query-debugger?query=${encodeURIComponent(`SELECT * FROM ${table.table_name} LIMIT 10`)}`);
                                            }}
                                          >
                                            <Terminal className="h-3 w-3 mr-1" />
                                            Run in Debugger
                                          </Button>
                                        </div>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Column Name</TableHead>
                                            <TableHead>Data Type</TableHead>
                                            <TableHead>Nullable</TableHead>
                                            <TableHead>Default</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {columns.map((column, idx) => (
                                            <TableRow key={idx}>
                                              <TableCell className="font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                  {column.is_primary_key && (
                                                    <Key className="h-3 w-3 text-yellow-500" />
                                                  )}
                                                  {column.is_foreign_key && (
                                                    <LinkIcon className="h-3 w-3 text-blue-500" />
                                                  )}
                                                  {column.column_name}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant="outline">{column.data_type}</Badge>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={column.is_nullable === 'YES' ? 'secondary' : 'default'}>
                                                  {column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="font-mono text-xs">
                                                {column.column_default || '-'}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      Column information not available. Use Query Debugger to explore table structure.
                                    </div>
                                  )}
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="views" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Views</CardTitle>
                <CardDescription>All views in the public schema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {views.map((view) => (
                      <Card key={view.table_name}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Eye className="h-5 w-5 text-purple-500" />
                              <div>
                                <CardTitle className="text-lg">{view.table_name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {view.view_definition}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const query = `SELECT * FROM ${view.table_name} LIMIT 10`;
                                copyToClipboard(query);
                                toast({
                                  title: 'Query Copied',
                                  description: `Copied: ${query}`,
                                });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Query
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Functions</CardTitle>
                <CardDescription>All functions in the public schema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {functions.map((func) => (
                      <Card key={func.function_name}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Code2 className="h-5 w-5 text-green-500" />
                              <div>
                                <CardTitle className="text-lg font-mono">{func.function_name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  Returns: {func.return_type} • Args: {func.arguments}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const query = func.arguments === 'none' 
                                  ? `SELECT ${func.function_name}()`
                                  : `SELECT ${func.function_name}(...)`;
                                copyToClipboard(query);
                                toast({
                                  title: 'Query Copied',
                                  description: `Copied: ${query}`,
                                });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Query
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

