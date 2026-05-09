import fitz  # PyMuPDF
import pdfplumber
from typing import Tuple, Dict
import os

class PDFService:
    @staticmethod
    def analyze_pdf(file_path: str) -> Dict:
        """
        Detects if a PDF is scanned or has selectable text.
        Returns a dict with type and confidence.
        """
        doc = fitz.open(file_path)
        total_pages = len(doc)
        text_pages = 0
        image_only_pages = 0
        
        # We also check with pdfplumber for more accurate text detection
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and len(text.strip()) > 50:
                    text_pages += 1
                else:
                    image_only_pages += 1
        
        is_scanned = text_pages < (total_pages / 2)
        confidence = (image_only_pages / total_pages) if is_scanned else (text_pages / total_pages)
        
        return {
            "is_scanned": is_scanned,
            "confidence": round(confidence, 2),
            "page_count": total_pages,
            "type": "scanned" if is_scanned else "text"
        }

    @staticmethod
    def get_page_as_image(file_path: str, page_number: int, output_path: str):
        """
        Converts a PDF page to an image for OCR or preview.
        """
        doc = fitz.open(file_path)
        page = doc.load_page(page_number)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # high res
        pix.save(output_path)
        doc.close()
