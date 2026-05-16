import { Badge } from './Badge';

type Status = 'open' | 'closed' | 'cancelled' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export function OrderStatusBadge({ status }: { status: Status }) {
  const s = String(status).toLowerCase();
  if (s === 'open') return <Badge variant="warning" dot>Aguardando</Badge>;
  if (s === 'closed') return <Badge variant="success" dot>Fechado</Badge>;
  if (s === 'cancelled') return <Badge variant="danger" dot>Cancelado</Badge>;
  return null;
}
