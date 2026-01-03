import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <Link href="/" className="no-underline text-blue-600 mb-8 block">
          ← Voltar para Home
        </Link>
        <h1>Política de Privacidade</h1>
        <p className="lead">Última atualização: {new Date().toLocaleDateString()}</p>

        <p>
          A sua privacidade é importante para nós. É política do {APP_CONFIG.NAME} respeitar a sua
          privacidade em relação a qualquer informação sua que possamos coletar no site{' '}
          {APP_CONFIG.NAME}, e outros sites que possuímos e operamos.
        </p>

        <h3>1. Informações que coletamos</h3>
        <p>
          Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe
          fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e
          consentimento. Também informamos por que estamos coletando e como será usado.
        </p>

        <h3>2. Retenção de dados</h3>
        <p>
          Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço
          solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis
          para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não
          autorizados.
        </p>

        <h3>3. Compartilhamento</h3>
        <p>
          Não compartilhamos informações de identificação pessoal publicamente ou com terceiros,
          exceto quando exigido por lei.
        </p>
      </div>
    </div>
  );
}
