import React, { useState, useEffect } from 'react';
import './Invoice.css';

// Inline SVGs to ensure they print correctly in the data-url window
const MarkerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="ulicalogo" fill="currentColor">
        <path d="M12,6a4,4,0,1,0,4,4A4,4,0,0,0,12,6Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,12Z"/>
        <path d="M12,24a5.271,5.271,0,0,1-4.311-2.2c-3.811-5.257-5.744-9.209-5.744-11.747a10.055,10.055,0,0,1,20.11,0c0,2.538-1.933,6.49-5.744,11.747A5.271,5.271,0,0,1,12,24ZM12,2.181a7.883,7.883,0,0,0-7.874,7.874c0,2.01,1.893,5.727,5.329,10.466a3.145,3.145,0,0,0,5.09,0c3.436-4.739,5.329-8.456,5.329-10.466A7.883,7.883,0,0,0,12,2.181Z"/>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="phonelogo" fill="currentColor">
        <path d="M14.2,16.261A12.133,12.133,0,0,1,7.747,9.793l3.4-3.406L4.887.122,1.716,3.292A5.9,5.9,0,0,0,0,7.5C0,14.748,9.252,24,16.5,24a5.889,5.889,0,0,0,4.207-1.716l3.171-3.171-6.265-6.265Zm5.092,4.609A3.9,3.9,0,0,1,16.5,22C10.267,22,2,13.733,2,7.5A3.907,3.907,0,0,1,3.13,4.707L4.887,2.95,8.324,6.387,5.389,9.322l.245.614a14.372,14.372,0,0,0,8.447,8.436l.606.231,2.926-2.927,3.437,3.437ZM14,2V0A10.011,10.011,0,0,1,24,10H22A8.009,8.009,0,0,0,14,2Zm0,4V4a6.006,6.006,0,0,1,6,6H18A4,4,0,0,0,14,6Z"/>
    </svg>
);

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
                <p style={{ textAlign: 'center' }}>------------------------------------</p>
                <p className='office'>Money & Crypto Exchange Office</p>
                <p className='fejzullai'>FEJZULLAI</p>
                <p className='company'>COMPANY</p>
                
                <div className='info'>
                    <p className='ulica'>
                        <MarkerIcon /> 
                        Ul/Rr.Brakja Ginoski 135
                    </p>
                    <p className='phoneno'>
                        <PhoneIcon /> 
                        070 378 645
                    </p>
                </div>
                
                <p style={{ textAlign: 'center' }}>------------------------------------</p>
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
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#000', fontWeight: 'bold', marginTop: '5px' }}>
                    Serial: {serial}
                </p>
            </div>
        </div>
    );
});

export default Invoice;