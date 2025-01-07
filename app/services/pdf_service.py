import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import qrcode
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

class PDFService:
    def __init__(self):
        self.templates_dir = Path("templates")
        self.output_dir = Path("generated_pdfs")
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )

    def generate_invoice(
        self,
        invoice_data: Dict[str, Any],
        template_name: str = "invoice_modern.html",
        output_format: str = "pdf"
    ) -> str:
        """Generate invoice in specified format"""
        # Generate QR code for payment info
        qr_path = self._generate_qr_code(invoice_data)
        invoice_data['qr_code'] = qr_path

        # Add formatted dates and currency
        invoice_data['formatted_date'] = datetime.now().strftime("%Y-%m-%d")
        invoice_data['formatted_due_date'] = (
            datetime.strptime(invoice_data['due_date'], "%Y-%m-%d")
            .strftime("%Y-%m-%d") if 'due_date' in invoice_data else None
        )

        # Render template
        template = self.env.get_template(template_name)
        html_content = template.render(**invoice_data)

        if output_format == "html":
            # Save as HTML
            output_path = self.output_dir / f"invoice_{invoice_data['invoice_number']}.html"
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            return str(output_path)
        else:
            # Convert to PDF
            return self._html_to_pdf(html_content, f"invoice_{invoice_data['invoice_number']}.pdf")

    def generate_purchase_order(
        self,
        po_data: Dict[str, Any],
        template_name: str = "purchase_order_modern.html"
    ) -> str:
        """Generate purchase order PDF"""
        # Add formatted dates
        po_data['formatted_date'] = datetime.now().strftime("%Y-%m-%d")
        
        # Render template
        template = self.env.get_template(template_name)
        html_content = template.render(**po_data)
        
        return self._html_to_pdf(html_content, f"po_{po_data['po_number']}.pdf")

    def generate_delivery_note(
        self,
        delivery_data: Dict[str, Any],
        template_name: str = "delivery_note_modern.html"
    ) -> str:
        """Generate delivery note PDF"""
        # Add formatted dates
        delivery_data['formatted_date'] = datetime.now().strftime("%Y-%m-%d")
        
        # Render template
        template = self.env.get_template(template_name)
        html_content = template.render(**delivery_data)
        
        return self._html_to_pdf(
            html_content,
            f"delivery_note_{delivery_data['delivery_number']}.pdf"
        )

    def _generate_qr_code(self, invoice_data: Dict[str, Any]) -> str:
        """Generate QR code for payment information"""
        qr_data = {
            'invoice_number': invoice_data['invoice_number'],
            'amount': invoice_data['total_amount'],
            'currency': invoice_data['currency'],
            'company': invoice_data['company_name']
        }
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(str(qr_data))
        qr.make(fit=True)

        qr_path = self.output_dir / f"qr_{invoice_data['invoice_number']}.png"
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(str(qr_path))
        
        return str(qr_path)

    def _html_to_pdf(self, html_content: str, output_filename: str) -> str:
        """Convert HTML content to PDF"""
        font_config = FontConfiguration()
        css = CSS(string='''
            @page {
                size: A4;
                margin: 1.5cm;
            }
            body {
                font-family: Arial, sans-serif;
            }
        ''', font_config=font_config)
        
        output_path = self.output_dir / output_filename
        HTML(string=html_content).write_pdf(
            str(output_path),
            stylesheets=[css],
            font_config=font_config
        )
        
        return str(output_path)
