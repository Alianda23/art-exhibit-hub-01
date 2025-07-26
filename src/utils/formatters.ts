
// Format price in Kenyan Shillings
export const formatPrice = (price: number): string => {
  return `Ksh ${new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)}`;
};

// Format date
export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date(dateString).toLocaleDateString('en-KE', options);
};

// Format date range
export const formatDateRange = (startDate: string, endDate: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const start = new Date(startDate).toLocaleDateString('en-KE', options);
  const end = new Date(endDate).toLocaleDateString('en-KE', options);
  return `${start} - ${end}`;
};
