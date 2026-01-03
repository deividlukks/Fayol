import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <Link href="/" className="no-underline text-blue-600 mb-8 block">
          ← Voltar para Home
        </Link>
        <h1>Termos de Uso</h1>

        <h3>1. Termos</h3>
        <p>
          Ao acessar ao site {APP_CONFIG.NAME}, concorda em cumprir estes termos de serviço, todas
          as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas
          as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de
          usar ou acessar este site.
        </p>

        <h3>2. Uso de Licença</h3>
        <p>
          É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou
          software) no site {APP_CONFIG.NAME}, apenas para visualização transitória pessoal e não
          comercial. Esta é a concessão de uma licença, não uma transferência de título.
        </p>

        <h3>3. Isenção de responsabilidade</h3>
        <p>
          Os materiais no site da {APP_CONFIG.NAME} são fornecidos &apos;como estão&apos;.{' '}
          {APP_CONFIG.NAME} não oferece garantias, expressas ou implícitas, e, por este meio, isenta
          e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou
          condições de comercialização, adequação a um fim específico ou não violação de propriedade
          intelectual ou outra violação de direitos.
        </p>
      </div>
    </div>
  );
}
