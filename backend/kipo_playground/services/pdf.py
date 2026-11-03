# services/pdf.py
from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse

def generate_production_pdf(production_instance):
    # Contexto com os dados já salvos no banco
    context = {
        'title': production_instance.title,
        'author': production_instance.author.get_full_name(),
        'bncc_codes': production_instance.bncc_competencies.all(),
        'summary': production_instance.summary,
        'methodology': production_instance.methodology,
        'objectives': production_instance.objectives,
    }
    
    # Renderiza o HTML com CSS
    html_string = render_to_string('pdf/production_template.html', context)
    
    # Gera o PDF em memória
    pdf_file = HTML(string=html_string).write_pdf()
    
    # Retorna o arquivo HTTP
    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="TEIA_{production_instance.id}.pdf"'
    return response