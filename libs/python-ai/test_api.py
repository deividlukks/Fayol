"""
Test Suite para API  - Integration Tests
===========================================

Testa os endpoints da API  via HTTP requests.
Útil para validar o serviço após deploy.
"""

import requests
import sys
from typing import Dict, Any
from datetime import datetime, timedelta


class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_test(name: str):
    print(f"\n{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{name}{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*60}{Colors.ENDC}")


def print_success(msg: str):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")


def print_error(msg: str):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")


def print_info(msg: str):
    print(f"{Colors.OKCYAN}ℹ {msg}{Colors.ENDC}")


def test_health_check(base_url: str) -> bool:
    """Testa o endpoint de health check"""
    print_test("TEST 1: Health Check")

    try:
        response = requests.get(f"{base_url}/")
        response.raise_for_status()

        data = response.json()
        print_info(f"Status: {data.get('status')}")
        print_info(f"Service: {data.get('service')}")
        print_info(f"Version: {data.get('version')}")
        print_info(f"Accuracy Target: {data.get('accuracy_target')}")

        if data.get('version') == '2.0.0':
            print_success("Serviço  está online!")
            return True
        else:
            print_error(f"Versão incorreta: {data.get('version')}")
            return False

    except Exception as e:
        print_error(f"Falha na conexão: {e}")
        return False


def test_categorization(base_url: str) -> bool:
    """Testa o endpoint de categorização """
    print_test("TEST 2: Categorization ")

    test_cases = [
        {"description": "Netflix assinatura mensal", "amount": 45.90},
        {"description": "Supermercado Extra", "amount": 250.00},
        {"description": "Uber para trabalho", "amount": 25.50},
    ]

    success_count = 0

    for case in test_cases:
        try:
            response = requests.post(
                f"{base_url}/categorize",
                params={"use_": True},
                json=case
            )
            response.raise_for_status()

            result = response.json()

            print_info(f"\nDescrição: {case['description']}")
            print_info(f"Categoria: {result.get('category')}")
            print_info(f"Confiança: {result.get('confidence', 0)*100:.1f}%")
            print_info(f"Aceito: {result.get('accepted')}")
            print_info(f"Método: {result.get('method')}")

            if result.get('alternatives'):
                print_info(f"Alternativas: {len(result.get('alternatives'))}")

            if result.get('category'):
                success_count += 1
                print_success("Categorização bem-sucedida")
            else:
                print_error("Nenhuma categoria retornada")

        except Exception as e:
            print_error(f"Erro: {e}")

    success_rate = (success_count / len(test_cases)) * 100
    print_info(f"\nTaxa de sucesso: {success_count}/{len(test_cases)} ({success_rate:.0f}%)")

    return success_count == len(test_cases)


def test_insights(base_url: str) -> bool:
    """Testa o endpoint de insights/análise """
    print_test("TEST 3: Insights & Analysis ")

    # Gera transações de teste
    base_date = datetime.now() - timedelta(days=30)
    transactions = []

    for i in range(20):
        transactions.append({
            "id": f"tx_{i}",
            "description": "Compra teste",
            "amount": 100 + (i * 10),
            "category": "Alimentação",
            "date": (base_date + timedelta(days=i)).isoformat(),
            "type": "expense"
        })

    # Adiciona uma anomalia
    transactions.append({
        "id": "anomaly",
        "description": "Compra suspeita",
        "amount": 5000,
        "category": "Compras",
        "date": (base_date + timedelta(days=15)).isoformat(),
        "type": "expense"
    })

    try:
        response = requests.post(
            f"{base_url}/insights",
            params={"use_": True},
            json={"transactions": transactions}
        )
        response.raise_for_status()

        insights = response.json()

        print_info(f"Total de insights gerados: {len(insights)}")

        for insight in insights[:5]:  # Mostra apenas os 5 primeiros
            print_info(f"  [{insight.get('priority')}] {insight.get('type')}: {insight.get('message')[:60]}...")

        if len(insights) > 0:
            print_success(f"Análise gerou {len(insights)} insights")
            return True
        else:
            print_error("Nenhum insight gerado")
            return False

    except Exception as e:
        print_error(f"Erro: {e}")
        return False


def test_forecast(base_url: str) -> bool:
    """Testa o endpoint de previsão """
    print_test("TEST 4: Forecast ")

    # Gera histórico de 3 meses
    base_date = datetime.now() - timedelta(days=90)
    transactions = []

    for i in range(60):
        transactions.append({
            "id": f"tx_{i}",
            "description": "Despesa mensal",
            "amount": 1500 + (i * 5),  # Tendência crescente
            "category": "Alimentação",
            "date": (base_date + timedelta(days=i)).isoformat(),
            "type": "expense"
        })

    try:
        response = requests.post(
            f"{base_url}/forecast",
            params={"use_": True},
            json={"transactions": transactions}
        )
        response.raise_for_status()

        result = response.json()

        print_info(f"Previsão: R$ {result.get('predicted_amount', 0):.2f}")
        print_info(f"Tendência: {result.get('trend')}")
        print_info(f"Último mês real: R$ {result.get('last_month_actual', 0):.2f}")
        print_info(f"Variação: {result.get('variation_percent', 0):.1f}%")
        print_info(f"Modelos usados: {', '.join(result.get('models_used', []))}")
        print_info(f"Amostras: {result.get('n_samples', 0)}")

        ci = result.get('confidence_interval', {})
        if ci:
            print_info(f"Intervalo de confiança: R$ {ci.get('lower', 0):.2f} - R$ {ci.get('upper', 0):.2f}")

        if result.get('predicted_amount', 0) > 0:
            print_success("Previsão gerada com sucesso")
            return True
        else:
            print_error("Previsão inválida")
            return False

    except Exception as e:
        print_error(f"Erro: {e}")
        return False


def test_model_metrics(base_url: str) -> bool:
    """Testa o endpoint de métricas do modelo"""
    print_test("TEST 5: Model Metrics")

    try:
        response = requests.get(f"{base_url}/models/metrics")
        response.raise_for_status()

        metrics = response.json()

        print_info(f"Version: {metrics.get('version')}")

        cat_metrics = metrics.get('categorizer_', {})
        if cat_metrics:
            print_info(f"Categorizer accuracy: {cat_metrics.get('accuracy', 0)*100:.1f}%")
            print_info(f"Total samples: {cat_metrics.get('total_samples', 0)}")
            print_info(f"Features: {cat_metrics.get('n_features', 0)}")

        print_success("Métricas obtidas com sucesso")
        return True

    except Exception as e:
        print_error(f"Erro: {e}")
        return False


def test_comparison_v1_(base_url: str) -> bool:
    """Testa o endpoint de comparação V1 vs """
    print_test("TEST 6: V1 vs  Comparison")

    try:
        response = requests.post(
            f"{base_url}/compare",
            json={"description": "Netflix assinatura", "amount": 45.90}
        )
        response.raise_for_status()

        result = response.json()

        v1 = result.get('v1_result', {})
         = result.get('_result', {})
        improvement = result.get('improvement', {})

        print_info("V1 Result:")
        print_info(f"  Category: {v1.get('category')}")
        print_info(f"  Confidence: {v1.get('confidence', 0)*100:.0f}%")
        print_info(f"  Method: {v1.get('method')}")

        print_info("\n Result:")
        print_info(f"  Category: {.get('category')}")
        print_info(f"  Confidence: {.get('confidence', 0)*100:.1f}%")
        print_info(f"  Accepted: {.get('accepted')}")
        print_info(f"  Method: {.get('method')}")

        print_info("\nImprovements:")
        print_info(f"  Model complexity: {improvement.get('model_complexity')}")
        print_info(f"  Features: {improvement.get('features')}")
        print_info(f"  Expected accuracy gain: {improvement.get('expected_accuracy')}")

        print_success("Comparação realizada com sucesso")
        return True

    except Exception as e:
        print_error(f"Erro: {e}")
        return False


def run_all_api_tests(base_url: str = "http://localhost:8000"):
    """Executa todos os testes de API"""

    print(f"""
{Colors.HEADER}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          API  INTEGRATION TESTS                                ║
║          Testing High-Accuracy AI Services                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
{Colors.ENDC}

Base URL: {base_url}
""")

    results = {}

    # Executa testes
    results['health'] = test_health_check(base_url)

    if not results['health']:
        print_error("\nServiço não está disponível. Verifique se está rodando.")
        return False

    results['categorization'] = test_categorization(base_url)
    results['insights'] = test_insights(base_url)
    results['forecast'] = test_forecast(base_url)
    results['metrics'] = test_model_metrics(base_url)
    results['comparison'] = test_comparison_v1_(base_url)

    # Resumo
    print_test("SUMMARY")

    total = len(results)
    passed = sum(1 for r in results.values() if r)

    print(f"\nTests run: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success rate: {passed/total*100:.0f}%\n")

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        color = Colors.OKGREEN if result else Colors.FAIL
        print(f"{color}{status}{Colors.ENDC} - {test_name}")

    if passed == total:
        print_success("\nTodos os testes passaram! API  está funcionando perfeitamente.")
    else:
        print_error(f"\n{total - passed} teste(s) falharam. Verifique os logs acima.")

    return passed == total


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Test Fayol AI  API')
    parser.add_argument(
        '--url',
        default='http://localhost:8000',
        help='Base URL do serviço (default: http://localhost:8000)'
    )

    args = parser.parse_args()

    success = run_all_api_tests(args.url)
    sys.exit(0 if success else 1)
