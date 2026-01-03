import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';

export default function LgpdPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <Link href="/" className="no-underline text-blue-600 mb-8 block">
          ← Voltar para Home
        </Link>
        <h1>Conformidade com a LGPD</h1>
        <p>
          O {APP_CONFIG.NAME} está comprometido com a segurança dos seus dados e em total
          conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <h3>Seus Direitos</h3>
        <ul>
          <li>
            <strong>Acesso:</strong> Você pode solicitar uma cópia de todos os seus dados.
          </li>
          <li>
            <strong>Correção:</strong> Você pode corrigir dados incompletos, inexatos ou
            desatualizados.
          </li>
          <li>
            <strong>Anonimização:</strong> Anonimização, bloqueio ou eliminação de dados
            desnecessários.
          </li>
          <li>
            <strong>Portabilidade:</strong> Exportação dos seus dados para outro fornecedor de
            serviço (Recurso disponível no Dashboard).
          </li>
          <li>
            <strong>Eliminação:</strong> Exclusão dos dados pessoais tratados com o consentimento do
            titular.
          </li>
        </ul>

        <h3>Encarregado de Dados (DPO)</h3>
        <p>
          Para exercer seus direitos ou tirar dúvidas sobre o tratamento de seus dados, entre em
          contato com nosso Encarregado de Proteção de Dados através do email:{' '}
          <a href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}>{APP_CONFIG.SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
