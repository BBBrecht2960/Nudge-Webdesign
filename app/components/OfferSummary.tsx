'use client';


interface OfferSummaryProps {
  subtotal: number;
  vat: number;
  total: number;
  discountAmount?: number;
  customLineItems?: Array<{ id: string; name: string; price: number }>;
}

export function OfferSummary({
  subtotal,
  vat,
  total,
  discountAmount = 0,
  customLineItems = [],
}: OfferSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="bg-card border-2 border-border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Offerte Overzicht</h3>
      
      <div className="space-y-3 mb-4">
        {customLineItems.length > 0 && (
          <>
            {customLineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{formatPrice(item.price)}</span>
              </div>
            ))}
          </>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
          <span className="font-medium">{formatPrice(subtotal + discountAmount)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Korting</span>
            <span className="font-medium">-{formatPrice(discountAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotaal na korting</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">BTW (21%)</span>
          <span className="font-medium">{formatPrice(vat)}</span>
        </div>
        
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Totaal (incl. BTW)</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
