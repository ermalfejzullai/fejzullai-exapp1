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
    officeInfo?: {
        officeName?: string;
        address?: string;
        phone?: string;
    };
}

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>((props, ref) => {
    const { type, details, total, officeInfo } = props;
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const formatNumber = (val: number) => val.toFixed(2);

    const isBuy = type === 'BUY' || type === 'MULTI';
    const typeLabel = isBuy ? 'Blerje/Купувам' : 'Shitje/Продавам';
    const totalHeader = isBuy ? 'Totali Вкупно MKD' : 'Totali Вкупно EUR/Foreign';

    return (
        <div ref={ref}>
            <div className='page'>
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='office'>Money & Crypto Exchange Office</p>
                <p className='fejzullai'>{officeInfo?.officeName?.split(' ')[0] || 'FEJZULLAI'}</p>
                <p className='company'>{officeInfo?.officeName?.split(' ').slice(1).join(' ') || 'COMPANY'}</p>
                
                <div className='info'>
                    <p className='ulica'>
                        <img src={marker} className='ulicalogo' alt="loc" /> 
                        {officeInfo?.address || 'Ul/Rr.Brakja Ginoski 135'}
                    </p>
                    <p className='phoneno'>
                        <img src={phonelogo} className='phonelogo' alt="phone" /> 
                        {officeInfo?.phone || '070 378 645'}
                    </p>
                </div>
                
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='fatura'>Faturë/Сметка</p>
                <p className='type'>{typeLabel}</p>

                <table className='table'>
                    <tbody>
                        <tr className='noborder'>
                            <td className='table-cell'><p className='headers'>Valuta Валута</p></td>
                            <td className='table-cell'><p className='headers'>Shuma Износ</p></td>
                            <td className='table-cell'><p className='headers'>Kursi Курс</p></td>
                            <td className='table-cell'><p className='headers'>{totalHeader}</p></td>
                        </tr>

                        {details.map((row, idx) => (
                            <tr key={idx}>
                                <td className='table-cell'>{row.currency}</td>
                                <td className='table-cell'>{formatNumber(row.amount)}</td>
                                <td className='table-cell'>{formatNumber(row.rate)}</td>
                                <td className='table-cell'>{formatNumber(row.mkd_equivalent)}</td>
                            </tr>
                        ))}

                        {/* If multi-row, show total */}
                        {details.length > 1 && (
                            <tr className='totalrow'>
                                <td className='emptycell'></td>
                                <td className='emptycell'></td>
                                <td className='emptycell'></td>
                                <td className='totalmulticell'>{total}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <p className='thanks'>Ju Faleminderit!<br />Ви Благодариме!</p>
                <p className='date-and-time'>
                    {dateTime.toLocaleDateString('en-GB')}{' '} 
                    {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </p>
            </div>
        </div>
    );
});

export default Invoice;