import Link from 'next/link';

type SignatureReceiptProps = {
  message: string;
  receipt: string;
  city: string;
};

export const SignatureReceipt = ({
  message,
  receipt,
  city,
}: SignatureReceiptProps) => (
  <div>
    <div className="alert alert--success">{message}</div>
    <div className="success-city-label">Protocolo da assinatura</div>
    <div className="receipt-code">{receipt}</div>
    <div className="success-city-label">Município de votação</div>
    <div className="success-city-name">{city}</div>
    <Link className="btn" href="/pec/painel">
      Ver o andamento da coleta
    </Link>
  </div>
);
