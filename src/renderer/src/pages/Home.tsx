import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { ExchangeRate } from '@shared/types';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Trash2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Invoice } from '../components/Invoice';

export function Home() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const user = useAuthStore((state) => state.user);
  
  // Common State
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  
  // Sell MKD State
  const [mkdInput, setMkdInput] = useState('');
  
  // Multi State
  const [multiRows, setMultiRows] = useState<{currency: string, amount: string}[]>([
      { currency: 'EUR', amount: '' },
      { currency: 'USD', amount: '' },
      { currency: 'CHF', amount: '' },
  ]);

  const [lastSerial, setLastSerial] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<{type: string, serial: string, total: string, details: any[]} | null>(null);

  const DEFAULT_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP', 'AUD', 'CAD', 'TRY', 'ALL'];

  useEffect(() => {
    window.api.getRates().then((data) => {
        if (data.length === 0) {
            const initialRates = DEFAULT_CURRENCIES.map((c, i) => ({
                currency: c,
                buy_rate: 0,
                sell_rate: 0,
                id: i,
                updated_at: ''
            }));
            setRates(initialRates);
        } else {
            const mergedRates = DEFAULT_CURRENCIES.map((c, i) => {
                const existing = data.find(r => r.currency === c);
                return existing || { currency: c, buy_rate: 0, sell_rate: 0, id: i, updated_at: '' };
            });
            setRates(mergedRates);
        }
    });
  }, []);

  const getRate = (currency: string) => rates.find(r => r.currency === currency);

  const calculateBuy = () => {
    const rate = getRate(selectedCurrency)?.buy_rate || 0;
    const val = parseFloat(amount) || 0;
    return (val * rate).toFixed(2);
  };

  const calculateSell = () => {
    const rate = getRate(selectedCurrency)?.sell_rate || 0;
    const val = parseFloat(amount) || 0;
    return (val * rate).toFixed(2);
  };

  const calculateSellMkd = () => {
      const rate = getRate(selectedCurrency)?.sell_rate || 0;
      const mkd = parseFloat(mkdInput) || 0;
      if (rate === 0) return '0.00';
      return (mkd / rate).toFixed(2);
  };

  const calculateMultiTotal = () => {
      return multiRows.reduce((sum, row) => {
          const rate = getRate(row.currency)?.buy_rate || 0;
          const val = parseFloat(row.amount) || 0;
          return sum + (val * rate);
      }, 0).toFixed(2);
  };

  const handleSave = async (type: 'BUY' | 'SELL' | 'SELL_MKD' | 'MULTI') => {
      if (!user) return;
      let details: any[] = [];
      if (type === 'BUY') {
          const rate = getRate(selectedCurrency)?.buy_rate || 0;
          details.push({ currency: selectedCurrency, amount: parseFloat(amount), rate: rate, mkd_equivalent: parseFloat(amount) * rate });
      } else if (type === 'SELL') {
          const rate = getRate(selectedCurrency)?.sell_rate || 0;
          details.push({ currency: selectedCurrency, amount: parseFloat(amount), rate: rate, mkd_equivalent: parseFloat(amount) * rate });
      } else if (type === 'SELL_MKD') {
          const rate = getRate(selectedCurrency)?.sell_rate || 0;
          const foreignAmount = parseFloat(mkdInput) / rate;
          details.push({ currency: selectedCurrency, amount: foreignAmount, rate: rate, mkd_equivalent: parseFloat(mkdInput) });
      } else if (type === 'MULTI') {
          details = multiRows.filter(r => r.amount && parseFloat(r.amount) > 0).map(row => {
              const rate = getRate(row.currency)?.buy_rate || 0;
              return { currency: row.currency, amount: parseFloat(row.amount), rate: rate, mkd_equivalent: parseFloat(row.amount) * rate };
          });
      }

      if (details.length === 0) return;

      try {
          const result = await window.api.saveTransaction({ type, details, userId: user.id });
          if (result.success) {
              setLastSerial(result.serialKey);
              const txData = {
                  type,
                  serial: result.serialKey,
                  total: type === 'BUY' ? calculateBuy() : type === 'SELL' ? calculateSell() : type === 'SELL_MKD' ? calculateSellMkd() : calculateMultiTotal(),
                  details: details
              };
              setCurrentTransaction(txData);
              setInvoiceOpen(true);
              setAmount('');
              setMkdInput('');
              if (type === 'MULTI') setMultiRows(multiRows.map(r => ({ ...r, amount: '' })));
          }
      } catch (e) {
          console.error(e);
          alert('Error saving transaction');
      }
  };

  const addRow = () => setMultiRows([...multiRows, { currency: 'EUR', amount: '' }]);
  const removeRow = (idx: number) => setMultiRows(multiRows.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: 'currency' | 'amount', val: string) => {
      const newRows = [...multiRows];
      newRows[idx] = { ...newRows[idx], [field]: val };
      setMultiRows(newRows);
  };

  const handlePrint = async () => {
    const invoiceContent = document.getElementById('invoice-to-print')?.innerHTML;
    if (!invoiceContent) return;

    const baseHref = document.baseURI;
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <base href="${baseHref}" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: white; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { font-family: "Outfit", sans-serif; font-weight: 400; font-size: 16px; width: 80mm; max-width: 80mm; margin: 0 auto; }
            .fejzullai { text-align: center; font-weight: 820; font-size: 30px; margin-bottom: 1px; }
            .company { text-align: center; font-weight: 300; font-size: 22px; margin-top: -2px; margin-bottom: 1px; }
            .fatura { text-align: center; font-weight: 600; }
            .type { text-align: center; font-size: 14px; }
            .office { text-align: center; margin-bottom: -15px; font-size: 14px; margin-top: -17px; }
            .table { margin-left: auto; margin-right: auto; border-collapse: collapse; font-size: 11px; width: 100%; }
            .table-cell { padding: 10px; border: 2px dashed black; border-collapse: collapse; font-weight: 560; text-align: center; }
            .headers { font-weight: 700; margin: 0; }
            .thanks { text-align: center; font-size: 18px; }
            .phonelogo, .ulicalogo { height: 13px; width: 15px; margin-right: 5px; }
            .info { text-align: center; font-size: 12px; font-style: italic; }
            .info .ulica { padding-right: 52px; margin-bottom: -5px; }
            .info .phoneno { padding-right: 115px; margin-bottom: -20px; }
            .date-and-time { text-align: center; margin-top: -12px; font-size: 13px; }
            .totalrow { border: none; }
            .totalmulticell { text-align: center; padding: 10px; border: 2px dashed black; border-collapse: collapse; font-weight: 710; font-size: 15px; }
            .emptycell { border: none; }
            .noborder .table-cell { border-top: none; border-left: none; border-right: none; }
            @page { margin: 0; size: 80mm auto; }
          </style>
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `;

    await window.api.printInvoice(html);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Currency Exchange</h2>
        {lastSerial && <div className="text-sm text-muted-foreground">Last Transaction: {lastSerial}</div>}
      </div>
      
      <Tabs defaultValue="buy" className="w-full">
        {/* ... tabs headers ... */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buy">Buy (In Foreign)</TabsTrigger>
          <TabsTrigger value="sell">Sell (Out Foreign)</TabsTrigger>
          <TabsTrigger value="sell_mkd">Sell MKD (In MKD)</TabsTrigger>
          <TabsTrigger value="multi">Multi-Currency</TabsTrigger>
        </TabsList>
        
        {/* ... (Tabs Content is unchanged, just hiding it for brevity in this tool call, will keep in file) ... */}
        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle>Buy Foreign Currency</CardTitle>
              <CardDescription>Customer gives Foreign Currency &rarr; You give MKD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex gap-4 items-end">
                   <div className="space-y-2 w-1/4">
                       <Label>Currency</Label>
                       <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {rates.map(r => <SelectItem key={r.currency} value={r.currency}>{r.currency}</SelectItem>)}
                           </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2 flex-1">
                       <Label>Amount</Label>
                       <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="text-lg" />
                   </div>
                   <div className="space-y-2 w-1/4">
                       <Label>Rate</Label>
                       <Input disabled value={getRate(selectedCurrency)?.buy_rate || ''} className="bg-muted" />
                   </div>
               </div>
               <div className="p-6 bg-secondary/50 rounded-lg flex justify-between items-center">
                   <span className="text-lg font-medium">Total to Pay (MKD):</span>
                   <span className="text-4xl font-bold text-primary">{calculateBuy()}</span>
               </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full gap-2" onClick={() => handleSave('BUY')}>
                    <Printer className="h-5 w-5" /> Save & Print Invoice
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sell">
          <Card>
            <CardHeader>
              <CardTitle>Sell Foreign Currency</CardTitle>
              <CardDescription>Customer gives MKD &rarr; You give Foreign Currency</CardDescription>
            </CardHeader>
             <CardContent className="space-y-6">
               <div className="flex gap-4 items-end">
                   <div className="space-y-2 w-1/4">
                       <Label>Currency</Label>
                       <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {rates.map(r => <SelectItem key={r.currency} value={r.currency}>{r.currency}</SelectItem>)}
                           </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2 flex-1">
                       <Label>Amount (Foreign)</Label>
                       <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="text-lg" />
                   </div>
                   <div className="space-y-2 w-1/4">
                       <Label>Rate</Label>
                       <Input disabled value={getRate(selectedCurrency)?.sell_rate || ''} className="bg-muted" />
                   </div>
               </div>
               <div className="p-6 bg-secondary/50 rounded-lg flex justify-between items-center">
                   <span className="text-lg font-medium">Total to Receive (MKD):</span>
                   <span className="text-4xl font-bold text-primary">{calculateSell()}</span>
               </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full gap-2" onClick={() => handleSave('SELL')}>
                    <Printer className="h-5 w-5" /> Save & Print Invoice
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="sell_mkd">
          <Card>
            <CardHeader>
              <CardTitle>Sell MKD to Any</CardTitle>
              <CardDescription>Calculate how much Foreign Currency for specific MKD amount</CardDescription>
            </CardHeader>
             <CardContent className="space-y-6">
               <div className="flex gap-4 items-end">
                   <div className="space-y-2 flex-1">
                       <Label>Amount (MKD)</Label>
                       <Input type="number" placeholder="0.00" value={mkdInput} onChange={e => setMkdInput(e.target.value)} className="text-lg" />
                   </div>
                   <div className="space-y-2 w-1/4">
                       <Label>Target Currency</Label>
                       <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {rates.map(r => <SelectItem key={r.currency} value={r.currency}>{r.currency}</SelectItem>)}
                           </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2 w-1/4">
                       <Label>Rate</Label>
                       <Input disabled value={getRate(selectedCurrency)?.sell_rate || ''} className="bg-muted" />
                   </div>
               </div>
               <div className="p-6 bg-secondary/50 rounded-lg flex justify-between items-center">
                   <span className="text-lg font-medium">Result ({selectedCurrency}):</span>
                   <span className="text-4xl font-bold text-primary">{calculateSellMkd()}</span>
               </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full gap-2" onClick={() => handleSave('SELL_MKD')}>
                    <Printer className="h-5 w-5" /> Save & Print Invoice
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="multi">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Currency Buy</CardTitle>
              <CardDescription>Convert multiple foreign currencies to MKD at once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {multiRows.map((row, idx) => (
                    <div key={idx} className="flex gap-4 items-end">
                        <Select value={row.currency} onValueChange={(v) => updateRow(idx, 'currency', v)}>
                           <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {rates.map(r => <SelectItem key={r.currency} value={r.currency}>{r.currency}</SelectItem>)}
                           </SelectContent>
                       </Select>
                       <Input type="number" placeholder="Amount" value={row.amount} onChange={(e) => updateRow(idx, 'amount', e.target.value)} className="flex-1" />
                       <div className="w-[100px] flex items-center justify-end px-2 text-sm text-muted-foreground">Rate: {getRate(row.currency)?.buy_rate}</div>
                       <div className="w-[150px] font-mono font-bold text-right px-2">{((parseFloat(row.amount)||0) * (getRate(row.currency)?.buy_rate||0)).toFixed(2)}</div>
                       <Button variant="ghost" size="icon" onClick={() => removeRow(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                <Button variant="outline" onClick={addRow} className="gap-2"><Plus className="h-4 w-4" /> Add Currency</Button>
               <div className="p-6 mt-4 bg-secondary/50 rounded-lg flex justify-between items-center">
                   <span className="text-lg font-medium">Total (MKD):</span>
                   <span className="text-4xl font-bold text-primary">{calculateMultiTotal()}</span>
               </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full gap-2" onClick={() => handleSave('MULTI')}>
                    <Printer className="h-5 w-5" /> Save & Print Invoice
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
               <DialogTitle>Invoice Generated</DialogTitle>
           </DialogHeader>
           
           <div id="invoice-to-print">
               {currentTransaction && (
                 <Invoice 
                    type={currentTransaction.type}
                    details={currentTransaction.details}
                    total={currentTransaction.total}
                    serial={currentTransaction.serial}
                 />
               )}
           </div>

           <DialogFooter>
               <Button onClick={handlePrint}>Print</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
