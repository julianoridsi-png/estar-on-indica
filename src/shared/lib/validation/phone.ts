import { onlyDigits } from "./cpf";

export function isValidPhone(value: string): boolean {
 const digits = onlyDigits(value);

 if (digits.length < 10 || digits.length > 11) return false;

 const ddd = Number(digits.slice(0, 2));
 if (ddd < 11 || ddd > 99) return false;

 if (digits.length === 11 && digits[2] !== "9") return false;

 return true;
}

export function formatPhoneInput(value: string): string {
 const digits = onlyDigits(value).slice(0, 11);

 if (digits.length === 0) return "";
 if (digits.length <= 2) return `(${digits}`;

 const ddd = digits.slice(0, 2);
 const subscriber = digits.slice(2);

 if (subscriber.length <= 4) {
 return `(${ddd}) ${subscriber}`;
 }

 const splitAt = subscriber.length <= 8 ? 4 : 5;
 return `(${ddd}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
}

export function formatPhone(value: string): string {
 const digits = onlyDigits(value);
 if (digits.length < 10) return value;
 return formatPhoneInput(digits);
}

export function whatsappLink(phone: string, message: string): string {
 const digits = onlyDigits(phone);
 const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
 return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
