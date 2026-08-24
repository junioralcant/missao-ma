export type Group = {
  id: number;
  city: string;
  whatsappLink: string;
  createdAt: string;
  updatedAt: string;
};

export type Registration = {
  id: number;
  name: string;
  cpf: string;
  city: string;
  createdAt: string;
};

export type RegistrationInput = {
  name: string;
  cpf: string;
  city: string;
};
