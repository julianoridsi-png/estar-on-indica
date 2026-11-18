export function onlyDigits(value: string): string {
 return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
 const cpf = onlyDigits(value);
 if (cpf.length !== 11) return false;
 if (/^(\d)\1{10}$/.test(cpf)) return false;

 const digits = cpf.split("").map(Number);

 const calculateDigit = (length: number) => {
 let sum = 0;
 for (let i = 0; i < length; i += 1) {
 sum += digits[i] * (length + 1 - i);
 }
 const rest = (sum * 10) % 11;
 return rest === 10 ? 0 : rest;
 };

 const firstDigit = calculateDigit(9);
 const secondDigit = calculateDigit(10);

 return firstDigit === digits[9] && secondDigit === digits[10];
}

export function formatCpfInput(value: string): string {
 const digits = onlyDigits(value).slice(0, 11);
 let result = digits.slice(0, 3);

 if (digits.length > 3) result += `.${digits.slice(3, 6)}`;
 if (digits.length > 6) result += `.${digits.slice(6, 9)}`;
 if (digits.length > 9) result += `-${digits.slice(9, 11)}`;

 return result;
}

export function formatCpf(cpf: string): string {
 const digits = onlyDigits(cpf);
 if (digits.length !== 11) return cpf;
 return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Exibe apenas os dois últimos dígitos: ***.***.***-12 */
export function maskCpfFinal(finalDigits: string | null | undefined): string {
 return `***.***.***-${finalDigits ?? "**"}`;
}

export function maskEmail(email: string | null | undefined): string {
 if (!email) return "—";
 const [local, domain] = email.split("@");
 if (!local || !domain) return "—";
 const visible = local.slice(0, 2);
 return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}
