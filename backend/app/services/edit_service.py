import fitz  # PyMuPDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import os
from typing import List
from ..models.models import Edit

class EditService:
    @staticmethod
    def apply_edits(original_pdf_path: str, edits: List[Edit], output_path: str):
        """
        Applies a list of edits to a PDF and saves to output_path.
        Edits can be text replacement, redaction, or annotations.
        """
        doc = fitz.open(original_pdf_path)
        
        # Group edits by page
        edits_by_page = {}
        for edit in edits:
            if edit.page_number not in edits_by_page:
                edits_by_page[edit.page_number] = []
            edits_by_page[edit.page_number].append(edit)
            
        for page_num, page_edits in edits_by_page.items():
            page = doc.load_page(page_num)
            
            for edit in page_edits:
                if edit.edit_type == "redact":
                    # Add a black rectangle
                    rect = fitz.Rect(edit.x, edit.y, edit.x + edit.width, edit.y + edit.height)
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    page.apply_redactions()
                
                elif edit.edit_type == "text_replace":
                    # Draw a white rectangle then add text
                    rect = fitz.Rect(edit.x, edit.y, edit.x + edit.width, edit.y + edit.height)
                    page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
                    
                    # Add new text
                    # Note: We use page.insert_text for simplicity here
                    page.insert_text(
                        (edit.x, edit.y + edit.height - 2), 
                        edit.new_value or "", 
                        fontsize=edit.font_size or 10,
                        color=(0, 0, 0)
                    )
                
                elif edit.edit_type == "highlight":
                    rect = fitz.Rect(edit.x, edit.y, edit.x + edit.width, edit.y + edit.height)
                    page.add_highlight_annot(rect)
                    
                elif edit.edit_type == "annotation":
                    rect = fitz.Rect(edit.x, edit.y, edit.x + edit.width, edit.y + edit.height)
                    page.add_text_annot(rect.tl, edit.new_value or "")

                elif edit.edit_type == "stamp":
                    rect = fitz.Rect(edit.x, edit.y, edit.x + edit.width, edit.y + edit.height)
                    # We can use a simple text box for stamps
                    page.draw_rect(rect, color=(0.8, 0, 0), width=1)
                    page.insert_text(
                        (edit.x + 2, edit.y + edit.height - 2), 
                        edit.new_value or "STAMP", 
                        fontsize=12,
                        color=(0.8, 0, 0)
                    )

        # Save the result
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
