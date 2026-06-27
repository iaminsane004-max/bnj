import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, CreditCard, ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function OrderSuccess({ order, onBackToStore, shopUpi, shopPhone }) {
  const { id, customer_name, total_amount, delivery_type } = order;
  const shortOrderId = id.substring(0, 8).toUpperCase();

  // Re-generate WhatsApp payload for manual link fallback
  let itemsListText = '';
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      itemsListText += ` - ${item.quantity}x ${item.name} (₹${(item.price * item.quantity).toFixed(2)})\n`;
    });
  }

  const messagePayload = 
`🛍️ *New Order from bake n joy Website!*

*Order ID:* #${shortOrderId}
*Customer:* ${customer_name}
*Phone:* ${order.customer_phone}

*Items:*
${itemsListText}
*Total Amount:* ₹${parseFloat(total_amount).toFixed(2)}
*Delivery Type:* ${delivery_type}

*Status:* Awaiting Payment Verification`;

  const encodedMessage = encodeURIComponent(messagePayload);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${shopPhone || '919876543210'}&text=${encodedMessage}`;

  // Create the standard P2P UPI payment intent URL
  const upiIntentUrl = `upi://pay?pa=${shopUpi || 'bakeandjoy@okaxis'}&pn=bake%20n%20joy&am=${total_amount}&cu=INR&tn=Order_${shortOrderId}`;

  // Automatically open WhatsApp link on component mount
  React.useEffect(() => {
    if (whatsappUrl) {
      const timer = setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 500); // Small delay to let the page render first
      return () => clearTimeout(timer);
    }
  }, [whatsappUrl]);

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xl text-center space-y-6 animate-scale-up">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full shadow-inner">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-2xl font-black text-stone-900 heading-font">Order Received!</h1>
          <p className="text-stone-500 text-sm mt-1">We have sent your order details to the shop via WhatsApp.</p>
        </div>

        {/* Order Details Panel */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 text-left space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500 font-semibold">Order ID</span>
            <span className="text-stone-900 font-bold">#{shortOrderId}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500 font-semibold">Customer</span>
            <span className="text-stone-900 font-bold">{customer_name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500 font-semibold">Method</span>
            <span className="text-stone-900 font-bold">{delivery_type}</span>
          </div>
          <div className="border-t border-stone-200/60 my-2 pt-2 flex justify-between items-center text-base">
            <span className="text-stone-700 font-extrabold">Total Amount</span>
            <span className="text-amber-800 font-black">₹{parseFloat(total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* WhatsApp Send Action Button */}
        <div className="pt-1.5">
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-transform active:scale-95 duration-100 cursor-pointer"
          >
            Send Order Details via WhatsApp
          </a>
          <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
            (Popup blockers might have prevented automatic redirection. Click this button to manually send the order details)
          </p>
        </div>

        {/* UPI Payment Container */}
        <div className="border-t border-stone-150 pt-6 space-y-4">
          <div className="flex items-center justify-center gap-1.5 text-stone-700 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-amber-700" />
            <span>Pay via P2P UPI</span>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="bg-white p-4 rounded-2xl border-2 border-stone-100 shadow-sm flex items-center justify-center">
              <QRCodeSVG 
                value={upiIntentUrl} 
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Scan this QR Code using any UPI App</p>
          </div>

          {/* Mobile Direct Pay Button */}
          <div className="pt-2">
            <a 
              href={upiIntentUrl}
              className="w-full bg-amber-900 hover:bg-amber-950 text-white py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-95 duration-100 cursor-pointer"
            >
              Pay via UPI App
              <ArrowUpRight className="w-5 h-5" />
            </a>
            <p className="text-[11px] text-stone-500 mt-2">
              (Works on smartphones with GPay, PhonePe, Paytm, or BHIM installed)
            </p>
          </div>
        </div>

        {/* Go Back Shopping */}
        <div className="pt-4 border-t border-stone-100">
          <button 
            onClick={onBackToStore}
            className="text-sm font-bold text-stone-600 hover:text-amber-800 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
}
