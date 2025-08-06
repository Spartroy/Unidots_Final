import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import logo from "../../components/common/V1.png"; 

// Enhanced Styles with logo and date header row
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#f9fafb',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 56,
  },
  dateBox: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
  },
  headerBox: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginBottom: 18,
    padding: 14,
    textAlign: 'center',
  },
  header: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    color: '#bfdbfe',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 16,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  subheader: {
    fontSize: 13,
    marginBottom: 7,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
    color: '#2563eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 600,
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  total: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 7,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    minHeight: 32,
  },
  totalLabel: {
    width: '60%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  totalValue: {
    width: '40%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  priceLabel: {
    width: '60%',
    fontSize: 10,
    color: '#475569',
  },
  priceValue: {
    width: '40%',
    fontSize: 10,
    color: '#1e293b',
    textAlign: 'right',
  },
  bullets: {
    fontSize: 10,
    marginLeft: 14,
    marginBottom: 2,
  },
  notes: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#fef9c3',
    borderRadius: 4,
    fontSize: 10,
    color: '#b45309',
  },
  footer: {
    marginTop: 28,
    fontSize: 8,
    textAlign: 'center',
    color: '#9ca3af',
  }
});

// Utility: Format numbers/currency
const currency = (val) => {
  if (!val) return '0.00';
  return parseFloat(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const OrderReceiptDocument = ({ order }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Show only the date (not time) at top
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  };

  // Calculate price breakdown
  const getPriceBreakdown = () => {
    const { dimensions = {}, materialThickness, colors } = order.specifications || {};

    const width = parseFloat(dimensions.width || 0);
    const height = parseFloat(dimensions.height || 0);
    const widthRepeat = parseInt(dimensions.widthRepeatCount || 1);
    const heightRepeat = parseInt(dimensions.heightRepeatCount || 1);

    const totalWidth = width * widthRepeat;
    const totalHeight = height * heightRepeat;
    const totalArea = totalWidth * totalHeight;

    let materialPriceFactor = 0.85;
    if (materialThickness === 1.14) materialPriceFactor = 0.75;
    else if (materialThickness === 2.54) materialPriceFactor = 0.95;

    const colorMultiplier = colors || 1;

    const unit = 'cm';

    return {
      dimensions: `${width} × ${height} ${unit}`,
      repeats: `Width: ${widthRepeat} × Height: ${heightRepeat}`,
      totalArea: `${totalArea.toFixed(2)} sq. ${unit}`,
      colors: colorMultiplier,
      materialFactor: materialPriceFactor.toFixed(2),
      totalPrice: order.cost?.estimatedCost
        ? currency(order.cost.estimatedCost)
        : currency(totalArea * colorMultiplier * materialPriceFactor)
    };
  };

  const priceBreakdown = getPriceBreakdown();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Row: Logo + Date */}
        <View style={styles.topRow}>
          {/* LOGO Placeholder. Replace <View>  */}
          <View>
            <Image src= {logo} style={{width: 64, height: 64}}/>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{formatDateOnly(order.createdAt)}</Text>
          </View>
        </View>

        {/* Brand and Title */}
        <View style={styles.headerBox}>
          <Text style={styles.header}>Order Receipt</Text>
          <Text style={styles.brand}>Unidots Printing Solutions</Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number:</Text>
            <Text style={styles.value}>{order.orderNumber || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>
              {formatDate(order.createdAt)} {formatTime(order.createdAt)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{order.status || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Title:</Text>
            <Text style={styles.value}>{order.title || '-'}</Text>
          </View>
          {order.customer?.name && (
            <View style={styles.row}>
              <Text style={styles.label}>Client:</Text>
              <Text style={styles.value}>{order.customer.name}</Text>
            </View>
          )}
          {order.customer?.company && (
            <View style={styles.row}>
              <Text style={styles.label}>Company:</Text>
              <Text style={styles.value}>{order.customer.company}</Text>
            </View>
          )}
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Technical Specifications</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Material:</Text>
            <Text style={styles.value}>{order.specifications?.material || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Material Thickness:</Text>
            <Text style={styles.value}>{order.specifications?.materialThickness || 'N/A'} µm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dimensions:</Text>
            <Text style={styles.value}>{priceBreakdown.dimensions}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Repeat Count:</Text>
            <Text style={styles.value}>{priceBreakdown.repeats}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Colors:</Text>
            <Text style={styles.value}>{order.specifications?.colors || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Printing Mode:</Text>
            <Text style={styles.value}>{order.specifications?.printingMode || 'N/A'}</Text>
          </View>
          {order.specifications?.features && (
            <Text style={styles.bullets}>• {order.specifications.features.join('\n• ')}</Text>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Area:</Text>
            <Text style={styles.priceValue}>{priceBreakdown.totalArea}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Number of Colors:</Text>
            <Text style={styles.priceValue}>{priceBreakdown.colors}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Material Price Factor:</Text>
            <Text style={styles.priceValue}>{priceBreakdown.materialFactor}</Text>
          </View>
          
          <View style={styles.divider} />
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Estimated Total:</Text>
            <Text style={styles.totalValue}>${priceBreakdown.totalPrice}</Text>
          </View>
        </View>

        {order.notes && <Text style={styles.notes}>Notes: {order.notes}</Text>}

        <Text style={styles.footer}>
          This is an estimated price based on your specifications. Final pricing may vary.
          {'\n'}Thank For inquiries, contact us at info@unidots.com
        </Text>
      </Page>
    </Document>
  );
};

const OrderReceipt = ({ order }) => {
  if (!order) return null;
  return (
    <PDFDownloadLink
      document={<OrderReceiptDocument order={order} />}
      fileName={`order-receipt-${order.orderNumber}.pdf`}
      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      {({ loading }) =>
        loading ? 'Preparing receipt...' : 'Download Receipt'
      }
    </PDFDownloadLink>
  );
};

export default OrderReceipt;
