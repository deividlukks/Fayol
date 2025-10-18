import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Injectable()
export class ChartsService {
  private readonly quickChartBaseUrl = 'https://quickchart.io/chart';

  /**
   * Gera um gráfico de pizza para gastos por categoria
   */
  async generatePieChart(data: ChartDataPoint[], title: string): Promise<string> {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = data.map(d => d.color || this.getRandomColor());

    const chartConfig = {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
        }],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: '#333',
        },
        legend: {
          position: 'bottom',
          labels: {
            fontSize: 12,
            fontColor: '#333',
          },
        },
        plugins: {
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}%`;
            },
          },
        },
      },
    };

    const url = `${this.quickChartBaseUrl}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=600&height=400&format=png`;
    return url;
  }

  /**
   * Gera um gráfico de barras para evolução mensal
   */
  async generateBarChart(
    labels: string[],
    incomeData: number[],
    expenseData: number[],
    title: string
  ): Promise<string> {
    const chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            backgroundColor: '#4CAF50',
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: '#F44336',
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: '#333',
        },
        legend: {
          position: 'top',
          labels: {
            fontSize: 12,
            fontColor: '#333',
          },
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value: number) => {
                return 'R$ ' + value.toFixed(2);
              },
            },
          }],
        },
      },
    };

    const url = `${this.quickChartBaseUrl}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=500&format=png`;
    return url;
  }

  /**
   * Gera um gráfico de linha para evolução temporal
   */
  async generateLineChart(
    labels: string[],
    data: number[],
    title: string,
    label: string,
    color: string = '#2196F3'
  ): Promise<string> {
    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: '#333',
        },
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value: number) => {
                return 'R$ ' + value.toFixed(2);
              },
            },
          }],
        },
      },
    };

    const url = `${this.quickChartBaseUrl}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=400&format=png`;
    return url;
  }

  /**
   * Gera um gráfico de donut (rosquinha) para distribuição
   */
  async generateDonutChart(data: ChartDataPoint[], title: string): Promise<string> {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = data.map(d => d.color || this.getRandomColor());

    const chartConfig = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
        }],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: '#333',
        },
        legend: {
          position: 'right',
          labels: {
            fontSize: 12,
            fontColor: '#333',
          },
        },
        plugins: {
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}%`;
            },
          },
        },
      },
    };

    const url = `${this.quickChartBaseUrl}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=700&height=500&format=png`;
    return url;
  }

  /**
   * Baixa a imagem do gráfico gerado
   */
  async downloadChartImage(chartUrl: string): Promise<Buffer> {
    const response = await axios.get(chartUrl, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * Gera cor aleatória para gráficos
   */
  private getRandomColor(): string {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40',
      '#FFCD56', '#36A2EB', '#9966FF', '#FF6384', '#4BC0C0',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Paleta de cores para categorias específicas
   */
  getCategoryColor(categoryName: string): string {
    const colorMap: { [key: string]: string } = {
      'Alimentação': '#FF6384',
      'Transporte': '#36A2EB',
      'Moradia': '#FFCE56',
      'Saúde': '#4BC0C0',
      'Educação': '#9966FF',
      'Lazer': '#FF9F40',
      'Vestuário': '#FF6384',
      'Contas da Casa': '#C9CBCF',
      'Investimentos': '#4BC0C0',
      'Outros': '#FF9F40',
    };

    return colorMap[categoryName] || this.getRandomColor();
  }
}
