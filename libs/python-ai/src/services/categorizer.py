import pandas as pd
import joblib
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from typing import Optional, List, Tuple

MODEL_PATH = "data/models/category_model.joblib"
DATA_PATH = "data/models/learned_data.csv"

class CategorizerService:
    def __init__(self):
        self.model = None
        self.initial_data = {
            'Alimentação': ['ifood', 'uber eats', 'restaurante', 'padaria', 'supermercado', 'mercado', 'mc donalds', 'burger king', 'starbucks', 'fome', 'lanche', 'pizza', 'sorvete', 'acai'],
            'Transporte': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'ipiranga', 'shell', 'estacionamento', 'metro', 'onibus', 'trem', 'passagem'],
            'Lazer': ['netflix', 'spotify', 'amazon prime', 'cinema', 'steam', 'playstation', 'xbox', 'bar', 'show', 'festa', 'jogos', 'ingresso'],
            'Saúde': ['farmacia', 'drogasil', 'medico', 'hospital', 'dentista', 'exame', 'psicologo', 'academia', 'smartfit', 'drogaria'],
            'Educação': ['udemy', 'alura', 'curso', 'livraria', 'faculdade', 'escola', 'leitura', 'livro', 'ead', 'workshop'],
            'Moradia': ['aluguel', 'condominio', 'luz', 'agua', 'internet', 'vivo', 'claro', 'tim', 'oi', 'gas', 'enel', 'sabesp', 'iptu'],
            'Salário': ['pagamento', 'salario', 'ted recebida', 'pix recebido', 'proventos', 'remuneracao', 'ordenado'],
            'Investimentos': ['corretora', 'b3', 'tesouro', 'cdb', 'bitcoin', 'cripto', 'binance', 'nuinvest', 'rico', 'xp', 'aporte', 'dividendos'],
        }
        
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            print("✅ Modelo de categorização carregado do disco.")
        else:
            print("⚠️ Nenhum modelo encontrado. Treinando modelo inicial...")
            self._train_full_model()

    def _get_all_data(self):
        descriptions = []
        labels = []

        for category, keywords in self.initial_data.items():
            for keyword in keywords:
                descriptions.append(keyword)
                labels.append(category)

        if os.path.exists(DATA_PATH):
            try:
                df = pd.read_csv(DATA_PATH)
                descriptions.extend(df['description'].tolist())
                labels.extend(df['category'].tolist())
            except Exception as e:
                print(f"Erro ao ler dados aprendidos: {e}")

        return descriptions, labels

    def _train_full_model(self):
        descriptions, labels = self._get_all_data()

        if not descriptions:
            return

        model = make_pipeline(TfidfVectorizer(), MultinomialNB())
        model.fit(descriptions, labels)
        
        self.model = model
        joblib.dump(model, MODEL_PATH)
        print("✅ Modelo retreinado e salvo com sucesso.")

    def _calculate_dynamic_threshold(self, description: str, probs: np.ndarray) -> float:
        """
        Calcula um limiar dinâmico baseado na complexidade e incerteza.
        
        1. Complexidade: Descrições muito curtas (< 4 chars) são ambíguas, exigem alta confiança.
        2. Margem: Se a diferença entre o 1º e 2º colocado for pequena, o modelo está confuso.
        """
        base_threshold = 0.30
        
        # Fator de Complexidade (Tamanho)
        # Descrições curtas (ex: "Bar") aumentam a exigência
        if len(description.strip()) < 4:
            base_threshold += 0.35  # Sobe para 0.65
        elif len(description.strip()) < 8:
            base_threshold += 0.15  # Sobe para 0.45

        # Fator de Margem (Incerteza)
        # Ordena probabilidades para ver a distância entre o vencedor e o vice
        sorted_probs = np.sort(probs)
        if len(sorted_probs) >= 2:
            top1 = sorted_probs[-1]
            top2 = sorted_probs[-2]
            margin = top1 - top2
            
            # Se a margem for muito pequena (< 10%), aumenta o rigor
            if margin < 0.1:
                base_threshold += 0.10

        return min(base_threshold, 0.85) # Teto de 85%

    def predict_category(self, description: str) -> Optional[str]:
        if not description or len(description.strip()) < 2 or not self.model:
            return None

        try:
            clean_desc = description.lower().strip()
            
            # Predição
            category = self.model.predict([clean_desc])[0]
            probs = self.model.predict_proba([clean_desc])[0]
            confidence = max(probs)

            # Cálculo do limiar dinâmico
            threshold = self._calculate_dynamic_threshold(clean_desc, probs)

            if confidence > threshold:
                return category
            
            print(f"ℹ️ Predição descartada: {category} ({confidence:.2f}) < Limiar ({threshold:.2f})")
            return None
        except Exception as e:
            print(f"Erro na predição: {e}")
            return None

    def learn(self, description: str, category: str):
        new_data = pd.DataFrame({'description': [description.lower()], 'category': [category]})
        
        if not os.path.exists(DATA_PATH):
            new_data.to_csv(DATA_PATH, index=False)
        else:
            new_data.to_csv(DATA_PATH, mode='a', header=False, index=False)
            
        self._train_full_model()
        return True