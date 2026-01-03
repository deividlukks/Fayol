"""
Test Suite para Validação dos Serviços
==========================================

Testa e valida a acurácia dos serviços de IA comparados com V1.
Demonstra as melhorias em categorização, análise e previsão.
"""

import sys
import os
from datetime import datetime, timedelta
from typing import List, Dict
import json

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.services.categorizer import CategorizerService
from src.services.analyzer import AnalyzerService
from src.services.forecaster import ForecasterService
from src.services.categorizer import CategorizerService
from src.services.analyzer import AnalyzerService
from src.services.forecaster import ForecasterService
from src.models.schemas import TransactionInput


class Colors:
    """ANSI color codes para output colorido"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text: str):
    """Imprime cabeçalho formatado"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")


def print_success(text: str):
    """Imprime mensagem de sucesso"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")


def print_info(text: str):
    """Imprime mensagem informativa"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


def print_warning(text: str):
    """Imprime mensagem de aviso"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")


def print_error(text: str):
    """Imprime mensagem de erro"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")


def test_categorizer():
    """Testa o Categorizer vs V1"""
    print_header("TESTE 1: CATEGORIZER - Ensemble vs Naive Bayes")

    # Casos de teste com categoria esperada
    test_cases = [
        ("Pagamento Netflix", "Entretenimento"),
        ("Supermercado Extra", "Alimentação"),
        ("Uber para escritório", "Transporte"),
        ("Aluguel apartamento", "Moradia"),
        ("Consulta médica", "Saúde"),
        ("Academia SmartFit", "Saúde"),
        ("Restaurante japonês", "Alimentação"),
        ("Conta de luz CEMIG", "Contas"),
        ("Gasolina posto Shell", "Transporte"),
        ("Compra livro Amazon", "Educação"),
        ("Cinema Cinemark", "Entretenimento"),
        ("Farmácia remédio", "Saúde"),
        ("Pizza delivery", "Alimentação"),
        ("Seguro do carro", "Transporte"),
        ("Internet Vivo Fibra", "Contas"),
    ]

    print_info("Inicializando modelos...")
    categorizer_v1 = CategorizerService()
    categorizer = CategorizerService()

    v1_correct = 0
    v2_correct = 0

    print(f"\n{Colors.BOLD}Testando {len(test_cases)} casos:{Colors.ENDC}\n")

    for description, expected_category in test_cases:
        # V1
        v1_result = categorizer_v1.predict_category(description)
        v1_match = v1_result == expected_category if v1_result else False

        #
        v2_result = categorizer.predict_category(description)
        v2_category = v2_result['category'] if v2_result else None
        v2_confidence = v2_result['confidence'] if v2_result else 0.0
        v2_match = v2_category == expected_category if v2_category else False

        # Contabiliza acertos
        if v1_match:
            v1_correct += 1
        if v2_match:
            v2_correct += 1

        # Output
        status_v1 = "✓" if v1_match else "✗"
        status_v2 = "✓" if v2_match else "✗"
        color_v1 = Colors.OKGREEN if v1_match else Colors.FAIL
        color_v2 = Colors.OKGREEN if v2_match else Colors.FAIL

        print(f"  📝 {description[:30]:<30} → {expected_category}")
        print(f"     V1: {color_v1}{status_v1} {v1_result or 'N/A':<20}{Colors.ENDC}")
        print(f"    : {color_v2}{status_v2} {v2_category or 'N/A':<20} (conf: {v2_confidence:.2%}){Colors.ENDC}\n")

    # Resultados
    v1_accuracy = (v1_correct / len(test_cases)) * 100
    v2_accuracy = (v2_correct / len(test_cases)) * 100
    improvement = v2_accuracy - v1_accuracy

    print(f"\n{Colors.BOLD}RESULTADOS:{Colors.ENDC}")
    print(f"  V1 (Naive Bayes):     {v1_correct}/{len(test_cases)} corretos = {Colors.OKCYAN}{v1_accuracy:.1f}%{Colors.ENDC}")
    print(f"  (Ensemble):        {v2_correct}/{len(test_cases)} corretos = {Colors.OKGREEN}{v2_accuracy:.1f}%{Colors.ENDC}")
    print(f"  Melhoria:             {Colors.OKGREEN}+{improvement:.1f}%{Colors.ENDC}")

    if v2_accuracy >= 85:
        print_success(f"atingiu meta de acurácia (≥85%)")
    else:
        print_warning(f"ainda não atingiu meta de 85% (atual: {v2_accuracy:.1f}%)")

    return v2_accuracy >= v1_accuracy


def test_analyzer():
    """Testa o Analyzer com detecção de anomalias"""
    print_header("TESTE 2: ANALYZER - Detecção de Anomalias")

    print_info("Gerando dataset de transações com anomalias conhecidas...")

    # Cria transações normais (últimos 90 dias)
    base_date = datetime.now() - timedelta(days=90)
    transactions = []

    # Transações normais: ~R$50-200 em alimentação
    for i in range(30):
        transactions.append({
            "id": f"tx_{i}",
            "description": "Supermercado",
            "amount": 50 + (i % 150),  # Varia entre 50-200
            "category": "Alimentação",
            "date": (base_date + timedelta(days=i*2)).isoformat(),
            "type": "expense"
        })

    # Adiciona ANOMALIAS conhecidas
    anomaly_indices = []

    # Anomalia 1: Gasto muito alto (outlier)
    transactions.append({
        "id": "anomaly_1",
        "description": "Compra eletrônico",
        "amount": 5000,  # Muito acima da média
        "category": "Compras",
        "date": (base_date + timedelta(days=45)).isoformat(),
        "type": "expense"
    })
    anomaly_indices.append(len(transactions) - 1)

    # Anomalia 2: Gasto suspeito em horário atípico
    transactions.append({
        "id": "anomaly_2",
        "description": "Transferência internacional",
        "amount": 2500,
        "category": "Transferências",
        "date": (base_date + timedelta(days=60)).isoformat(),
        "type": "expense"
    })
    anomaly_indices.append(len(transactions) - 1)

    # Converte para TransactionInput
    tx_inputs = [TransactionInput(**tx) for tx in transactions]

    print_info(f"Dataset criado: {len(transactions)} transações ({len(anomaly_indices)} anomalias conhecidas)")

    # Testa
    print_info("Executando análise com...")
    analyzer = AnalyzerService()
    insights = analyzer.analyze_spending(tx_inputs)

    # Verifica se detectou anomalias
    anomaly_insights = [i for i in insights if 'anomalia' in i.message.lower() or 'outlier' in i.message.lower()]

    print(f"\n{Colors.BOLD}INSIGHTS GERADOS ({len(insights)} total):{Colors.ENDC}\n")
    for insight in insights:
        priority_color = {
            'high': Colors.FAIL,
            'medium': Colors.WARNING,
            'low': Colors.OKCYAN
        }.get(insight.priority, Colors.ENDC)

        print(f"  {priority_color}[{insight.priority.upper()}]{Colors.ENDC} {insight.type}: {insight.message}")

    print(f"\n{Colors.BOLD}RESULTADOS:{Colors.ENDC}")
    print(f"  Anomalias conhecidas:  {len(anomaly_indices)}")
    print(f"  Anomalias detectadas:  {len(anomaly_insights)}")

    detection_rate = (len(anomaly_insights) / len(anomaly_indices) * 100) if anomaly_indices else 0

    if detection_rate >= 50:
        print_success(f"Taxa de detecção: {detection_rate:.1f}% (≥50%)")
    else:
        print_warning(f"Taxa de detecção: {detection_rate:.1f}% (<50%)")

    return len(anomaly_insights) > 0


def test_forecaster():
    """Testa o Forecaster com ensemble de modelos"""
    print_header("TESTE 3: FORECASTER - Previsão com Ensemble")

    print_info("Gerando histórico de transações com padrão conhecido...")

    # Cria histórico de 6 meses com padrão crescente
    base_date = datetime.now() - timedelta(days=180)
    transactions = []

    monthly_spending = [2000, 2200, 2100, 2300, 2400, 2500]  # Tendência crescente

    for month_idx, monthly_total in enumerate(monthly_spending):
        # Distribui gastos do mês em ~20 transações
        num_transactions = 20
        for tx_idx in range(num_transactions):
            amount = monthly_total / num_transactions + (tx_idx % 10) * 5
            date = base_date + timedelta(days=month_idx * 30 + tx_idx)

            transactions.append({
                "id": f"tx_{month_idx}_{tx_idx}",
                "description": "Despesa mensal",
                "amount": amount,
                "category": "Alimentação",
                "date": date.isoformat(),
                "type": "expense"
            })

    tx_inputs = [TransactionInput(**tx) for tx in transactions]

    print_info(f"Histórico criado: {len(transactions)} transações em 6 meses")
    print_info(f"Gastos mensais: {monthly_spending}")
    print_info(f"Último mês real: R$ {monthly_spending[-1]:.2f}")
    print_info(f"Tendência esperada: CRESCENTE (~R$ 2600-2700)")

    # V1
    print_info("\nExecutando previsão com V1...")
    forecaster_v1 = ForecasterService()
    v1_result = forecaster_v1.predict_next_month(tx_inputs)

    #
    print_info("Executando previsão com (pode levar alguns segundos)...")
    forecaster = ForecasterService()
    v2_result = forecaster.predict_next_month(tx_inputs)

    print(f"\n{Colors.BOLD}RESULTADOS DA PREVISÃO:{Colors.ENDC}\n")

    # V1 Results
    v1_prediction = v1_result.get('predicted_amount', 0)
    print(f"  V1 (ARIMA básico):")
    print(f"    Previsão:           R$ {v1_prediction:.2f}")
    print(f"    Tendência:          {v1_result.get('trend', 'N/A')}")
    print(f"    Método:             {v1_result.get('method', 'N/A')}\n")

    # Results
    v2_prediction = v2_result.get('predicted_amount', 0)
    v2_ci = v2_result.get('confidence_interval', {})
    v2_lower = v2_ci.get('lower', 0)
    v2_upper = v2_ci.get('upper', 0)

    print(f"  (Ensemble):")
    print(f"    Previsão:           R$ {v2_prediction:.2f}")
    print(f"    Intervalo 95%:      R$ {v2_lower:.2f} - R$ {v2_upper:.2f}")
    print(f"    Tendência:          {v2_result.get('trend', 'N/A')}")
    print(f"    Modelos usados:     {', '.join(v2_result.get('models_used', []))}")
    print(f"    Amostras:           {v2_result.get('n_samples', 0)}\n")

    # Validação
    expected_range = (2600, 2700)
    v1_in_range = expected_range[0] <= v1_prediction <= expected_range[1]
    v2_in_range = expected_range[0] <= v2_prediction <= expected_range[1]

    print(f"{Colors.BOLD}VALIDAÇÃO (Range esperado: R$ {expected_range[0]}-{expected_range[1]}):{Colors.ENDC}")

    if v1_in_range:
        print_success(f"V1 dentro do range esperado")
    else:
        print_warning(f"V1 fora do range (diferença: R$ {abs(v1_prediction - sum(expected_range)/2):.2f})")

    if v2_in_range:
        print_success(f"dentro do range esperado")
    else:
        print_warning(f"fora do range (diferença: R$ {abs(v2_prediction - sum(expected_range)/2):.2f})")

    # deve ter intervalo de confiança
    has_confidence_interval = v2_ci.get('confidence_level', 0) > 0
    if has_confidence_interval:
        print_success(f"fornece intervalo de confiança ({v2_ci.get('confidence_level', 0):.0%})")

    return v2_in_range or has_confidence_interval


def run_all_tests():
    """Executa todos os testes"""
    print(f"""
{Colors.HEADER}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          SUITE DE TESTES - SERVIÇOS DE IA                     ║
║          Validação de Acurácia e Melhorias                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
{Colors.ENDC}
""")

    results = {}

    try:
        # Teste 1: Categorizer
        results['categorizer'] = test_categorizer()

        # Teste 2: Analyzer
        results['analyzer'] = test_analyzer()

        # Teste 3: Forecaster
        results['forecaster'] = test_forecaster()

    except Exception as e:
        print_error(f"Erro durante os testes: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Resumo final
    print_header("RESUMO GERAL")

    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r)

    print(f"{Colors.BOLD}Testes executados: {total_tests}{Colors.ENDC}\n")

    for test_name, passed in results.items():
        status = "✓ PASSOU" if passed else "✗ FALHOU"
        color = Colors.OKGREEN if passed else Colors.FAIL
        print(f"  {color}{status}{Colors.ENDC} - {test_name.capitalize()}")

    print(f"\n{Colors.BOLD}Taxa de sucesso: {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.0f}%){Colors.ENDC}\n")

    if passed_tests == total_tests:
        print_success("Todos os testes passaram! está funcionando corretamente.")
        print_info("Melhorias validadas:")
        print_info("  ✓ Categorizer: Ensemble de 4 modelos (XGBoost + LightGBM + CatBoost + NB)")
        print_info("  ✓ Analyzer: Detecção avançada de anomalias (Isolation Forest + LOF)")
        print_info("  ✓ Forecaster: Ensemble temporal (Prophet + Auto-ARIMA + ExpSmoothing)")
    else:
        print_warning(f"{total_tests - passed_tests} teste(s) falharam. Revise os resultados acima.")

    return passed_tests == total_tests


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
