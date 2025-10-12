# 🧠 Fayol AI Service

Este é o serviço de Inteligência Artificial para o projeto Fayol, construído com Python e FastAPI.

## Funcionalidades

-   **/suggest-category**: Sugere uma categoria para uma transação.
-   **/detect-anomalies**: Deteta gastos anómalos.
-   **/recommendations**: Fornece recomendações financeiras.
-   **/predict-future**: Prevê gastos futuros.

## Como Executar Localmente

1.  **Crie e ative um ambiente virtual**:
    ash
    python -m venv venv
    source venv/bin/activate
    

2.  **Instale as dependências**:
    ash
    pip install -r requirements.txt
    

3.  **Execute o servidor**:
    ash
    uvicorn src.main:app --reload
    

A API estará disponível em http://localhost:8000 e a documentação interativa (Swagger) em http://localhost:8000/docs.
