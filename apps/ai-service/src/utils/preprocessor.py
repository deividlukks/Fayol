import re

def preprocess_text(text: str) -> str:
    """
    Limpa e normaliza uma string de texto.
    - Converte para minúsculas
    - Remove pontuação
    - Remove espaços extras
    """
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
