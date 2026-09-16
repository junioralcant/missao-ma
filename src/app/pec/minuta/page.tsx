import Link from 'next/link';
import {SiteHeader} from '@/app/components/SiteHeader';
import {getProposalDocument, isArticleHeading} from '@/lib/document';

export const dynamic = 'force-dynamic';

export default function MinutaPage() {
  const document = getProposalDocument();

  return (
    <>
      <SiteHeader label="Íntegra da proposta" />
      <main className="page page--reading">
        <header className="admin-header">
          <h1 className="document-title">{document.title}</h1>
          <div className="row-actions">
            <a
              className="btn btn--small"
              href={document.downloadPath}
              download={document.fileName}
            >
              Baixar o documento
            </a>
            <Link className="btn btn--small btn--ghost" href="/pec">
              Assinar
            </Link>
          </div>
        </header>

        <section className="card">
          <article className="document">
            {document.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  isArticleHeading(paragraph)
                    ? 'document-paragraph document-paragraph--article'
                    : 'document-paragraph'
                }
              >
                {paragraph}
              </p>
            ))}
          </article>
        </section>

        <section className="card">
          <h2>Conferir o arquivo</h2>
          <p className="muted">
            O texto acima foi extraído do arquivo original{' '}
            <strong>{document.fileName}</strong>, que você pode baixar e
            conferir. Toda assinatura registra o código abaixo, então é possível
            provar depois exatamente qual arquivo foi assinado.
          </p>
          <div className="field">
            <label htmlFor="document-hash">Código do arquivo (SHA-256)</label>
            <input
              id="document-hash"
              className="input-mono"
              readOnly
              value={document.hash}
            />
          </div>
          <a
            className="btn"
            href={document.downloadPath}
            download={document.fileName}
          >
            Baixar o documento
          </a>
        </section>

        <p className="footer-note">
          <Link href="/pec">Voltar e assinar a proposta</Link>
        </p>
      </main>
    </>
  );
}
