import { CategorizerService } from '../../src/categorization/categorizer';

describe('CategorizerService', () => {
  let service: CategorizerService;

  beforeEach(() => {
    service = new CategorizerService();
  });

  describe('predictCategory', () => {
    describe('Alimentação', () => {
      it('should categorize iFood transactions', () => {
        expect(service.predictCategory('Pedido no iFood')).toBe('Alimentação');
      });

      it('should categorize Uber Eats transactions', () => {
        expect(service.predictCategory('Uber Eats - Jantar')).toBe('Alimentação');
      });

      it('should categorize restaurant transactions', () => {
        expect(service.predictCategory('Restaurante do João')).toBe('Alimentação');
      });

      it('should categorize supermarket transactions', () => {
        expect(service.predictCategory('Compra supermercado')).toBe('Alimentação');
      });

      it('should categorize fast food', () => {
        expect(service.predictCategory('MC DONALDS')).toBe('Alimentação');
        expect(service.predictCategory('Burger King')).toBe('Alimentação');
      });

      it('should categorize coffee shops', () => {
        expect(service.predictCategory('STARBUCKS')).toBe('Alimentação');
      });

      it('should handle case insensitive', () => {
        expect(service.predictCategory('IFOOD PEDIDO')).toBe('Alimentação');
      });
    });

    describe('Transporte', () => {
      it('should categorize Uber transactions', () => {
        expect(service.predictCategory('Uber do trabalho')).toBe('Transporte');
      });

      it('should categorize 99 transactions', () => {
        expect(service.predictCategory('Corrida 99')).toBe('Transporte');
      });

      it('should categorize taxi transactions', () => {
        expect(service.predictCategory('Taxi para o aeroporto')).toBe('Transporte');
      });

      it('should categorize gas station', () => {
        expect(service.predictCategory('Posto Ipiranga')).toBe('Transporte');
        expect(service.predictCategory('Shell gasolina')).toBe('Transporte');
      });

      it('should categorize fuel purchases', () => {
        expect(service.predictCategory('Combustivel')).toBe('Transporte');
        expect(service.predictCategory('Gasolina')).toBe('Transporte');
      });

      it('should categorize parking', () => {
        expect(service.predictCategory('Estacionamento shopping')).toBe('Transporte');
      });

      it('should categorize metro', () => {
        expect(service.predictCategory('Recarga metro')).toBe('Transporte');
      });
    });

    describe('Lazer', () => {
      it('should categorize streaming services', () => {
        expect(service.predictCategory('Netflix assinatura')).toBe('Lazer');
        expect(service.predictCategory('Spotify Premium')).toBe('Lazer');
        expect(service.predictCategory('Amazon Prime Video')).toBe('Lazer');
      });

      it('should categorize cinema', () => {
        expect(service.predictCategory('Ingresso cinema')).toBe('Lazer');
      });

      it('should categorize gaming', () => {
        expect(service.predictCategory('Steam jogo')).toBe('Lazer');
        expect(service.predictCategory('PlayStation Plus')).toBe('Lazer');
        expect(service.predictCategory('Xbox Game Pass')).toBe('Lazer');
      });

      it('should categorize bars and shows', () => {
        expect(service.predictCategory('Bar da esquina')).toBe('Lazer');
        expect(service.predictCategory('Show de rock')).toBe('Lazer');
      });
    });

    describe('Saúde', () => {
      it('should categorize pharmacies', () => {
        expect(service.predictCategory('Farmacia Sao Paulo')).toBe('Saúde');
        expect(service.predictCategory('Drogasil')).toBe('Saúde');
      });

      it('should categorize medical services', () => {
        expect(service.predictCategory('Consulta medico')).toBe('Saúde');
        expect(service.predictCategory('Hospital Samaritano')).toBe('Saúde');
        expect(service.predictCategory('Dentista')).toBe('Saúde');
      });

      it('should categorize exams', () => {
        expect(service.predictCategory('Exame laboratorio')).toBe('Saúde');
      });

      it('should categorize psychologist', () => {
        expect(service.predictCategory('Sessao psicologo')).toBe('Saúde');
      });
    });

    describe('Educação', () => {
      it('should categorize online courses', () => {
        expect(service.predictCategory('Udemy curso')).toBe('Educação');
        expect(service.predictCategory('Alura assinatura')).toBe('Educação');
      });

      it('should categorize educational purchases', () => {
        expect(service.predictCategory('Livraria Cultura')).toBe('Educação');
        expect(service.predictCategory('Mensalidade faculdade')).toBe('Educação');
        expect(service.predictCategory('Material escola')).toBe('Educação');
      });

      it('should categorize general courses', () => {
        expect(service.predictCategory('Curso de ingles')).toBe('Educação');
      });
    });

    describe('Moradia', () => {
      it('should categorize rent', () => {
        expect(service.predictCategory('Aluguel apartamento')).toBe('Moradia');
      });

      it('should categorize utilities', () => {
        expect(service.predictCategory('Conta de luz')).toBe('Moradia');
        expect(service.predictCategory('Conta de agua')).toBe('Moradia');
        expect(service.predictCategory('Conta de gas')).toBe('Moradia');
      });

      it('should categorize internet and phone', () => {
        expect(service.predictCategory('Internet Vivo')).toBe('Moradia');
        expect(service.predictCategory('Claro telefone')).toBe('Moradia');
        expect(service.predictCategory('Tim celular')).toBe('Moradia');
        expect(service.predictCategory('Oi fibra')).toBe('Moradia');
      });

      it('should categorize condo fees', () => {
        expect(service.predictCategory('Condominio')).toBe('Moradia');
      });
    });

    describe('Salário', () => {
      it('should categorize salary', () => {
        expect(service.predictCategory('Pagamento salario')).toBe('Salário');
      });

      it('should categorize transfers received', () => {
        expect(service.predictCategory('TED recebida')).toBe('Salário');
        expect(service.predictCategory('Pix recebido empresa')).toBe('Salário');
      });

      it('should categorize income', () => {
        expect(service.predictCategory('Proventos mensais')).toBe('Salário');
      });
    });

    describe('Investimentos', () => {
      it('should categorize brokerage', () => {
        expect(service.predictCategory('Corretora XP')).toBe('Investimentos');
      });

      it('should categorize stock market', () => {
        expect(service.predictCategory('B3 taxa')).toBe('Investimentos');
      });

      it('should categorize fixed income', () => {
        expect(service.predictCategory('Tesouro direto')).toBe('Investimentos');
        expect(service.predictCategory('CDB banco')).toBe('Investimentos');
      });

      it('should categorize crypto', () => {
        expect(service.predictCategory('Corretora XP')).toBe('Investimentos');
        expect(service.predictCategory('Binance cripto')).toBe('Investimentos');
      });
    });

    describe('Edge cases', () => {
      it('should return null for unrecognized category', () => {
        expect(service.predictCategory('Random transaction')).toBeNull();
      });

      it('should return null for empty description', () => {
        expect(service.predictCategory('')).toBeNull();
      });

      it('should handle multiple keywords in description', () => {
        const result = service.predictCategory('Uber do netflix');
        // Should match first found category (Transporte comes before Lazer in object)
        expect(result).toBe('Transporte');
      });

      it('should handle special characters', () => {
        expect(service.predictCategory('Uber!!!!')).toBe('Transporte');
      });

      it('should handle numbers in description', () => {
        expect(service.predictCategory('Uber 123 corrida')).toBe('Transporte');
      });

      it('should handle accented characters', () => {
        expect(service.predictCategory('Farmácia')).toBe('Saúde');
      });

      it('should match partial keywords', () => {
        expect(service.predictCategory('supermercado do bairro')).toBe('Alimentação');
      });
    });
  });
});
