import { Badge } from './ui/Badge';

type OrderStatus = 'open' | 'closed' | 'cancelled';

const labels: Record<OrderStatus, string> = {
  open: 'Aguardando',
  closed: 'Fechado',
  cancelled: 'Cancelado',
};

const variants: Record<OrderStatus, 'warning' | 'success' | 'danger'> = {
  open: 'warning',
  closed: 'success',
  cancelled: 'danger',
};

export function OrderStatus({ status }: { status: OrderStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
