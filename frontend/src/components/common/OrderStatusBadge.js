import React from 'react';
import { StatusBadge } from '../../design/kit';
import { useLanguage } from '../../context/LanguageContext';
import { statusKey } from '../../utils/orderStatus';

// The one way to show an order status: colour + shape + text, translated.
const OrderStatusBadge = ({ status }) => {
  const { t } = useLanguage();
  const key = statusKey(status);
  return <StatusBadge status={key} label={t(`status.label.${key}`)} />;
};

export default OrderStatusBadge;
