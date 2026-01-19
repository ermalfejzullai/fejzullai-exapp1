import React, { useState, useEffect } from 'react';
import './Invoice.css';
import phonelogo from '../assets/phone-call.svg';
import marker from '../assets/marker.svg';

interface InvoiceDetail {
    currency: string;
    amount: number;
    rate: number;
    mkd_equivalent: number;
}

interface InvoiceProps {
    type: string;
    details: InvoiceDetail[];
    total: string;
    serial: string;
}

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>((props, ref) => {
    const { type, details, total, serial } = props;
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const formatAmount = (val: number) => val.toFixed(2).replace(/\.00$/, '');
    const formatRate = (val: number) => val.toFixed(2);
    const formatTotal = (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    const isBuy = type === 'BUY' || type === 'MULTI';
    const typeLabel = isBuy ? 'Blerje/Купувам' : 'Shitje/Продавам';

    return (
        <div ref={ref}>
            <div className='page'>
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='office'>Money & Crypto Exchange Office</p>
                <p className='fejzullai'>FEJZULLAI</p>
                <p className='company'>COMPANY</p>
                
                <div className='info'>
                    <p className='ulica'>
                        <img src={marker} className='ulicalogo' alt="loc" /> 
                        Ul/Rr.Brakja Ginoski 135
                    </p>
                    <p className='phoneno'>
                        <img src={phonelogo} className='phonelogo' alt="phone" /> 
                        070 378 645
                    </p>
                </div>
                
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='fatura'>Faturë/Сметка</p>
                <p className='type'>{typeLabel}</p>

                <table className='table'>
                    <tbody>
                        <tr className='noborder'>
                            <td className='table-cell'><p className='headers'>Valuta<br />Валута</p></td>
                            <td className='table-cell'><p className='headers'>Shuma<br />Износ</p></td>
                            <td className='table-cell'><p className='headers'>Kursi<br />Курс</p></td>
                            <td className='table-cell'><p className='headers'>Totali<br />Вкупно<br />MKD</p></td>
                        </tr>

                        {details.map((row, idx) => (
                            <tr key={idx}>
                                <td className='table-cell'>{row.currency}</td>
                                <td className='table-cell'>{formatAmount(row.amount)}</td>
                                <td className='table-cell'>{formatRate(row.rate)}</td>
                                <td className='table-cell'>{formatTotal(row.mkd_equivalent)}</td>
                            </tr>
                        ))}

                        {/* If multi-row, show total */}
                        {details.length > 1 && (
                            <tr className='totalrow'>
                                <td className='emptycell'></td>
                                <td className='emptycell'></td>
                                <td className='emptycell'></td>
                                <td className='totalmulticell'>{formatTotal(parseFloat(total))}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <p className='thanks'>Ju Faleminderit!<br />Ви Благодариме!</p>
                <p className='date-and-time'>
                    {dateTime.toLocaleDateString('en-GB')}{' '} 
                    {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </p>
                <p style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '5px' }}>
                    Serial: {serial}
                </p>
            </div>
        </div>
    );
});

export default Invoice;