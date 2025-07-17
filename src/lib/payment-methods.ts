
import { Banknote, CreditCard, Landmark, Coins } from 'lucide-react';

export const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Landmark },
    { value: 'credito', label: 'Crédito', icon: Coins },
] as const;

type PaymentMethodValue = typeof paymentMethods[number]['value'];

export const paymentMethodIcons: Record<PaymentMethodValue, React.ReactElement> = {
  efectivo: <Banknote className="h-4 w-4 text-muted-foreground" />,
  tarjeta: <CreditCard className="h-4 w-4 text-muted-foreground" />,
  transferencia: <Landmark className="h-4 w-4 text-muted-foreground" />,
  credito: <Coins className="h-4 w-4 text-muted-foreground" />,
};

export const paymentMethodLabels: Record<PaymentMethodValue, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};
