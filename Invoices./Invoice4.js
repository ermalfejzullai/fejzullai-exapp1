import React, { useState, useEffect } from 'react'
import '../styles/Invoice.css'
import phonelogo from '../resources/phone-call.svg'
import marker from '../resources/marker.svg'

const Invoice = React.forwardRef((props, ref) => {
    const { selectedCurrency, amount, result, currencyValue,
        selectedCurrency2, amount2, result2, currencyValue2,
        selectedCurrency3, amount3, result3, currencyValue3 ,resultM} = props;
    function formatNumber(value) {
        const number = parseFloat(value);
        return number.toFixed(2);
    }
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div ref={ref}>
            <div className='page'>
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='office'>Money & Crypto Exchange Office</p>
                <p className='fejzullai'>FEJZULLAI</p>
                <p className='company'>COMPANY</p>
                <div className='info'>

                    <p className='ulica'><img src={marker} className='ulicalogo' /> Ul/Rr.Brakja Ginoski 135</p>
                    <p className='phoneno'><img src={phonelogo} className='phonelogo' /> 070 378 645</p>
                </div>
                <p style={{ textAlign: 'center' }}>--------------------------------------</p>
                <p className='fatura'>Faturë/Сметка</p>
                <p className='type'>Blerje/Купувам</p>


                <table className='table'>
                    <tr className='noborder'>
                        <td className='table-cell'><p className='headers'>Valuta Валута</p></td>
                        <td className='table-cell'><p className='headers'>Shuma Износ</p></td>
                        <td className='table-cell'><p className='headers'>Kursi Курс MKD</p></td>
                        <td className='table-cell'><p className='headers'>Totali Вкупно MKD</p></td>
                        

                    </tr>
                    <tr>
                        <td className='table-cell'>{selectedCurrency}</td>
                        <td className='table-cell'>{amount}</td>
                        <td className='table-cell'>{formatNumber(currencyValue)}</td>
                        <td className='table-cell'>{result}</td>
                    </tr>
                    <tr>
                        <td className='table-cell'>{selectedCurrency2}</td>
                        <td className='table-cell'>{amount2}</td>
                        <td className='table-cell'>{formatNumber(currencyValue2)}</td>
                        <td className='table-cell'>{result2}</td>
                    </tr>
                    <tr>
                        <td className='table-cell'>{selectedCurrency3}</td>
                        <td className='table-cell'>{amount3}</td>
                        <td className='table-cell'>{formatNumber(currencyValue3)}</td>
                        <td className='table-cell'>{result3}</td>
                    </tr>

                    <tr className='totalrow'>
                        <td className='emptycell'></td>
                        <td className='emptycell'></td>
                        <td className='emptycell'></td>
                        <td className='totalmulticell'>{resultM}</td>
                    </tr>

                </table>

                <p className='thanks'>Ju Faleminderit!<br />Ви Благодариме!</p>
                <p className='date-and-time'>{dateTime.toLocaleDateString('en-GB')}{' '} {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
        </div>
    );
});

export default Invoice