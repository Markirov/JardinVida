import React from 'react';
import { Store, Truck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { getOrderUrgency } from '../../../lib/stock-metrics';

export function OrderUrgencyBadge({ order }) {
  const urgency = getOrderUrgency(order);

  if (urgency.level === 'resolved') {
    return (
      <span className="orderUrgencyBadge badgeResolved">
        <CheckCircle2 size={13} /> Completado
      </span>
    );
  }

  return (
    <div className={`orderUrgencyContainer ${urgency.badgeColor || ''}`}>
      <span className="orderUrgencyBadge">
        {urgency.isPickup ? <Store size={13} /> : <Truck size={13} />}
        <strong>{urgency.label}</strong>
      </span>
      {urgency.timeAgo && (
        <span className="orderTimeAgo">
          <Clock size={12} /> {urgency.timeAgo}
        </span>
      )}
    </div>
  );
}
