export function StructuredData() {
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Nudge',
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
    description: 'Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt. Hasselt, België.',
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
