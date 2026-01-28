export function StructuredData() {
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Nudge Webdesign',
    legalName: 'Almost 3000 BV',
    taxID: 'BE 1007.673.513',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Herkenrodesingel 19C/4.2',
      addressLocality: 'Hasselt',
      postalCode: '3500',
      addressCountry: 'BE',
    },
    telephone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '',
    email: 'info@example.com', // UPDATE THIS - vervang met echt e-mailadres
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourwebsite.com',
    description: 'Nudge Webdesign - Webdesign op maat tegen een eerlijke prijs. Websites die voor jou werken en meegroeien met je business.',
    areaServed: {
      '@type': 'Country',
      name: 'Belgium',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }}
    />
  );
}
