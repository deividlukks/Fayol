from typing import Optional

class CategorizerService:
    def __init__(self):
        # Dicionário de palavras-chave para categorias (Regra Base)
        # Futuro: Substituir por modelo ML treinado (ex: Random Forest ou Naive Bayes)
        self.keywords = {
            'Alimentação': ['ifood', 'uber eats', 'restaurante', 'padaria', 'supermercado', 'mc donalds', 'burger king', 'starbucks', 'fome', 'lanche', 'pizza'],
            'Transporte': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'ipiranga', 'shell', 'estacionamento', 'metro', 'onibus'],
            'Lazer': ['netflix', 'spotify', 'amazon prime', 'cinema', 'steam', 'playstation', 'xbox', 'bar', 'show', 'festa'],
            'Saúde': ['farmacia', 'drogasil', 'medico', 'hospital', 'dentista', 'exame', 'psicologo', 'academia', 'smartfit'],
            'Educação': ['udemy', 'alura', 'curso', 'livraria', 'faculdade', 'escola', 'leitura', 'livro'],
            'Moradia': ['aluguel', 'condominio', 'luz', 'agua', 'internet', 'vivo', 'claro', 'tim', 'oi', 'gas', 'enel', 'sabesp'],
            'Salário': ['pagamento', 'salario', 'ted recebida', 'pix recebido', 'proventos', 'remuneracao'],
            'Investimentos': ['corretora', 'b3', 'tesouro', 'cdb', 'bitcoin', 'cripto', 'binance', 'nuinvest', 'rico', 'xp'],
        }

    def predict_category(self, description: str) -> Optional[str]:
        """
        Prediz a categoria com base na descrição.
        Atualmente usa Keyword Matching.
        Futuro: self.model.predict([description])
        """
        normalized_desc = description.lower()
        
        for category, keys in self.keywords.items():
            if any(key in normalized_desc for key in keys):
                return category
                
        return None