from xhtml2pdf import pisa
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
import os

class PDFGenerator:
    def __init__(self):
        # Configura o Jinja2 para ler da pasta templates
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def generate_monthly_report(self, data) -> bytes:
        template = self.env.get_template('monthly_report.html')
        
        # Formata os dados para o template
        html_content = template.render(
            title=data.title,
            period=data.period,
            user_name=data.user_name,
            summary=data.summary,
            transactions=data.transactions,
            generation_date=data.transactions[0].date if data.transactions else "" # Exemplo
        )
        
        return self._convert_html_to_pdf(html_content)

    def _convert_html_to_pdf(self, source_html: str) -> bytes:
        result = BytesIO()
        
        # Converte HTML para PDF usando xhtml2pdf
        pisa_status = pisa.CreatePDF(
            source_html,                # the HTML to convert
            dest=result                 # file handle to recieve result
        )
        
        if pisa_status.err:
            raise Exception(f"Erro na geração do PDF: {pisa_status.err}")
            
        return result.getvalue()