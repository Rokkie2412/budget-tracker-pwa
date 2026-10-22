export const normalizePhoneNumber = (phone: string, phoneCallingCode: string): string => {
	const phoneDigits = phone.replace(/\D/g, '');
	const isInternational = /^(?:\+|00)/.test(phone.trim());
	const nationalNumber =
		isInternational && phoneDigits.startsWith(phoneCallingCode)
			? phoneDigits.slice(phoneCallingCode.length)
			: phoneDigits;

	return phoneCallingCode + nationalNumber.replace(/^0+/, '');
};
