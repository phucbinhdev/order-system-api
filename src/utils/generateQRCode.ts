import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique QR code identifier for table
 */
export const generateQRCode = (): string => {
    const uniqueId = uuidv4().slice(0, 8).toUpperCase();
    return `TBL-${uniqueId}`;
};

export default generateQRCode;
