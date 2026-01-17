/**
 * Generate order number in format: ORD-YYYYMMDD-XXX
 */
export const generateOrderNumber = (sequence = 1): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequence).padStart(3, '0');

    return `ORD-${year}${month}${day}-${seq}`;
};

export default generateOrderNumber;
