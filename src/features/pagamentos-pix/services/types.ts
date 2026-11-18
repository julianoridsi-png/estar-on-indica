export const PIX_KEY_TYPES = [
 "cpf",
 "cnpj",
 "email",
 "telefone",
 "aleatoria",
] as const;

export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
 cpf: "CPF",
 cnpj: "CNPJ",
 email: "E-mail",
 telefone: "Telefone",
 aleatoria: "Chave aleatória",
};

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
 cpf: "000.000.000-00",
 cnpj: "00.000.000/0000-00",
 email: "voce@exemplo.com",
 telefone: "(11) 99999-9999",
 aleatoria: "Cole a chave aleatória (UUID)",
};

export type PayoutAccount = {
 tipo: PixKeyType;
 chave_mascarada: string;
 created_at: string;
 updated_at: string;
};

export type RevealedPixKey = {
 tipo: PixKeyType;
 chave: string;
 titular: string;
 email: string;
};
