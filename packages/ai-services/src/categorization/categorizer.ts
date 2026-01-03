import { CATEGORY_KEYWORDS } from './keywords';

export class CategorizerService {
  /**
   * Tenta adivinhar a categoria com base na descrição da transação
   * @param description Descrição da transação (ex: "Uber do trabalho")
   * @returns Nome da categoria sugerida ou null
   */
  public predictCategory(description: string): string | null {
    const normalizedDesc = description
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => normalizedDesc.includes(keyword))) {
        return category;
      }
    }

    return null;
  }
}
