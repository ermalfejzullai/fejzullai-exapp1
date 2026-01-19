import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Transaction } from '@shared/types';
import { FileDown, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const CURRENCIES = ['ALL', 'EUR', 'CHF', 'USD', 'GBP', 'AUD', 'CAD', 'TRY'];
const TYPES = ['ALL', 'BUY', 'SELL', 'SELL_MKD', 'MULTI'];

export function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
      startDate: '',
      endDate: '',
      type: 'ALL',
      currency: 'ALL',
      serialKey: ''
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
      loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
      const data = await window.api.getTransactions(filters);
      setTransactions(data);
  };

  const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleExpand = (id: number) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const handleExport = () => {
      // Simple CSV Export logic
      const headers = ['Serial', 'Date', 'Type', 'Total MKD', 'User'];
      const rows = transactions.map(t => [
          t.serial_key,
          new Date(t.transaction_date).toLocaleString(),
          t.transaction_type,
          t.total_mkd.toFixed(2),
          t.user_id
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleClearHistory = async () => {
      if (!currentUser) return;
      if (confirm('Are you sure you want to delete ALL transaction history? This cannot be undone.')) {
          try {
              const res = await window.api.clearTransactions({ adminId: currentUser.id });
              if (res.success) {
                  loadTransactions();
              } else {
                  alert(res.message);
              }
          } catch (error) {
              console.error(error);
              alert('Failed to clear history. See console for details.');
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
        <div className="flex gap-2">
            {currentUser?.role === 'admin' && (
                <Button variant="destructive" onClick={handleClearHistory} className="gap-2">
                    <Trash2 className="h-4 w-4" /> Clear History
                </Button>
            )}
            <Button variant="outline" onClick={handleExport} className="gap-2">
                <FileDown className="h-4 w-4" /> Export CSV
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className="flex gap-4 flex-wrap">
                <Input 
                    placeholder="Search Serial..." 
                    value={filters.serialKey} 
                    onChange={e => handleFilterChange('serialKey', e.target.value)}
                    className="w-[200px]"
                />
                <Select value={filters.type} onValueChange={v => handleFilterChange('type', v)}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                        {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.currency} onValueChange={v => handleFilterChange('currency', v)}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Currency" /></SelectTrigger>
                    <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c === 'ALL' ? 'All Currencies' : c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input 
                    type="date" 
                    value={filters.startDate} 
                    onChange={e => handleFilterChange('startDate', e.target.value)}
                    className="w-[160px]"
                />
                <Input 
                    type="date" 
                    value={filters.endDate} 
                    onChange={e => handleFilterChange('endDate', e.target.value)}
                    className="w-[160px]"
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Key</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total MKD</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                  <>
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(t.id)}>
                      <TableCell className="font-mono font-medium">{t.serial_key}</TableCell>
                      <TableCell>{new Date(t.transaction_date).toLocaleString()}</TableCell>
                      <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${ 
                              t.transaction_type === 'BUY' ? 'bg-green-100 text-green-800' : 
                              t.transaction_type === 'SELL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}> 
                              {t.transaction_type}
                          </span>
                      </TableCell>
                      <TableCell className="font-bold">{t.total_mkd.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === t.id && (
                        <TableRow className="bg-muted/30">
                            <TableCell colSpan={5}>
                                <div className="p-4">
                                    <h4 className="font-semibold mb-2">Transaction Details:</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Currency</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Rate</TableHead>
                                                <TableHead>MKD Equivalent</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {t.details?.map((d, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{d.currency}</TableCell>
                                                    <TableCell>{d.amount.toFixed(2)}</TableCell>
                                                    <TableCell>{d.rate.toFixed(2)}</TableCell>
                                                    <TableCell>{d.mkd_equivalent.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                  </>
              ))}
              {transactions.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No transactions found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}