import { CATEGORY_KEYWORDS } from '../../src/categorization/keywords';

describe('CATEGORY_KEYWORDS', () => {
  it('should have Alimentação category', () => {
    expect(CATEGORY_KEYWORDS.Alimentação).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Alimentação)).toBe(true);
  });

  it('should have Transporte category', () => {
    expect(CATEGORY_KEYWORDS.Transporte).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Transporte)).toBe(true);
  });

  it('should have Lazer category', () => {
    expect(CATEGORY_KEYWORDS.Lazer).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Lazer)).toBe(true);
  });

  it('should have Saúde category', () => {
    expect(CATEGORY_KEYWORDS.Saúde).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Saúde)).toBe(true);
  });

  it('should have Educação category', () => {
    expect(CATEGORY_KEYWORDS.Educação).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Educação)).toBe(true);
  });

  it('should have Moradia category', () => {
    expect(CATEGORY_KEYWORDS.Moradia).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Moradia)).toBe(true);
  });

  it('should have Salário category', () => {
    expect(CATEGORY_KEYWORDS.Salário).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Salário)).toBe(true);
  });

  it('should have Investimentos category', () => {
    expect(CATEGORY_KEYWORDS.Investimentos).toBeDefined();
    expect(Array.isArray(CATEGORY_KEYWORDS.Investimentos)).toBe(true);
  });

  describe('Alimentação keywords', () => {
    it('should contain food delivery services', () => {
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('ifood');
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('uber eats');
    });

    it('should contain restaurant keywords', () => {
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('restaurante');
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('padaria');
    });

    it('should contain supermarket keywords', () => {
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('supermercado');
    });

    it('should contain fast food chains', () => {
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('mc donalds');
      expect(CATEGORY_KEYWORDS.Alimentação).toContain('burger king');
    });
  });

  describe('Transporte keywords', () => {
    it('should contain ride-sharing services', () => {
      expect(CATEGORY_KEYWORDS.Transporte).toContain('uber');
      expect(CATEGORY_KEYWORDS.Transporte).toContain('99');
      expect(CATEGORY_KEYWORDS.Transporte).toContain('taxi');
    });

    it('should contain fuel-related keywords', () => {
      expect(CATEGORY_KEYWORDS.Transporte).toContain('combustivel');
      expect(CATEGORY_KEYWORDS.Transporte).toContain('gasolina');
    });

    it('should contain gas station brands', () => {
      expect(CATEGORY_KEYWORDS.Transporte).toContain('ipiranga');
      expect(CATEGORY_KEYWORDS.Transporte).toContain('shell');
    });

    it('should contain parking keywords', () => {
      expect(CATEGORY_KEYWORDS.Transporte).toContain('estacionamento');
    });
  });

  describe('Lazer keywords', () => {
    it('should contain streaming services', () => {
      expect(CATEGORY_KEYWORDS.Lazer).toContain('netflix');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('spotify');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('amazon prime');
    });

    it('should contain entertainment keywords', () => {
      expect(CATEGORY_KEYWORDS.Lazer).toContain('cinema');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('bar');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('show');
    });

    it('should contain gaming platforms', () => {
      expect(CATEGORY_KEYWORDS.Lazer).toContain('steam');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('playstation');
      expect(CATEGORY_KEYWORDS.Lazer).toContain('xbox');
    });
  });

  describe('All categories structure', () => {
    it('should have all keywords as lowercase strings', () => {
      Object.values(CATEGORY_KEYWORDS).forEach((keywords) => {
        keywords.forEach((keyword) => {
          expect(typeof keyword).toBe('string');
          expect(keyword).toBe(keyword.toLowerCase());
        });
      });
    });

    it('should not have duplicate keywords within same category', () => {
      Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
        const unique = new Set(keywords);
        expect(unique.size).toBe(keywords.length);
      });
    });

    it('should have at least 3 keywords per category', () => {
      Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
        expect(keywords.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should not have empty keywords', () => {
      Object.values(CATEGORY_KEYWORDS).forEach((keywords) => {
        keywords.forEach((keyword) => {
          expect(keyword.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });
});
