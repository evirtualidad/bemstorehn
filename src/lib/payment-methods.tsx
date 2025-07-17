
import { Banknote, CreditCard, Landmark, Coins } from 'lucide-react';

export const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Landmark },
    { value: 'credito', label: 'Crédito', icon: Coins },
] as const;

type PaymentMethodValue = typeof paymentMethods[number]['value'];

export const paymentMethodIcons: Record<PaymentMethodValue, React.ReactElement> = {
  efectivo: <Banknote className="mr-2 h-4 w-4" />,
  tarjeta: <CreditCard className="mr-2 h-4 w-4" />,
  transferencia: <Landmark className="mr-2 h-4 w-4" />,
  credito: <Coins className="mr-2 h-4 w-4" />,
};

export const paymentMethodLabels: Record<PaymentMethodValue, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};
