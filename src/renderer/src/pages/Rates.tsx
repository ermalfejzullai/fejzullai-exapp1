import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useAuthStore } from '../store/useAuthStore';
import { ExchangeRate } from '@shared/types';

const DEFAULT_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP', 'AUD', 'CAD', 'TRY', 'ALL'];

export function Rates() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const data = await window.api.getRates();
    // If no rates in DB, initialize with default currencies
    if (data.length === 0) {
      const initialRates = DEFAULT_CURRENCIES.map(c => ({
        currency: c,
        buy_rate: 0,
        sell_rate: 0,
        id: 0,
        updated_at: ''
      }));
      setRates(initialRates);
    } else {
        // Ensure all default currencies are present
        const mergedRates = DEFAULT_CURRENCIES.map(c => {
            const existing = data.find(r => r.currency === c);
            return existing || { currency: c, buy_rate: 0, sell_rate: 0, id: 0, updated_at: '' };
        });
        setRates(mergedRates);
    }
  };

  const handleRateChange = (index: number, field: 'buy_rate' | 'sell_rate', value: string) => {
    const newRates = [...rates];
    newRates[index] = { ...newRates[index], [field]: parseFloat(value) || 0 };
    setRates(newRates);
  };

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    setSuccessMsg('');
    try {
      await window.api.updateRates({ rates, userId: user.id });
      setSuccessMsg('Rates updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadRates(); // reload to get new timestamps
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Exchange Rates</h2>
        {successMsg && <span className="text-green-600 font-medium animate-pulse">{successMsg}</span>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Rates (MKD)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Currency</TableHead>
                <TableHead>Buy Rate</TableHead>
                <TableHead>Sell Rate</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate, index) => (
                <TableRow key={rate.currency}>
                  <TableCell className="font-medium">{rate.currency}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={rate.buy_rate} 
                      onChange={(e) => handleRateChange(index, 'buy_rate', e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={rate.sell_rate} 
                      onChange={(e) => handleRateChange(index, 'sell_rate', e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {rate.updated_at ? new Date(rate.updated_at).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 flex justify-end">
             <Button onClick={handleUpdate} disabled={loading} size="lg">
               {loading ? 'Updating...' : 'Save All Rates'}
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}