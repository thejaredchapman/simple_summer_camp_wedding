import { registerPlugin } from '@capacitor/core';

// Native method: shareImage({ phoneNumber: string, base64Image: string }) -> Promise<{ success: boolean }>
const SmsShare = registerPlugin('SmsShare');

export default SmsShare;
