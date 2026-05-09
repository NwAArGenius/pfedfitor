import pytesseract
from PIL import Image
import cv2
import numpy as np
from typing import List, Dict

class OCRService:
    @staticmethod
    def extract_text_from_image(image_path: str) -> Dict:
        """
        Extracts text from an image with bounding boxes.
        Uses Tesseract OCR.
        """
        img = cv2.imread(image_path)
        # Preprocessing image
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Thresholding to get black and white
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        # We use pytesseract to get detailed data
        ocr_data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
        
        results = []
        n_boxes = len(ocr_data['level'])
        for i in range(n_boxes):
            if int(ocr_data['conf'][i]) > 40:  # Confidence filter
                (x, y, w, h) = (ocr_data['left'][i], ocr_data['top'][i], ocr_data['width'][i], ocr_data['height'][i])
                results.append({
                    "text": ocr_data['text'][i],
                    "conf": ocr_data['conf'][i],
                    "x": x,
                    "y": y,
                    "w": w,
                    "h": h
                })
        
        return {
            "results": results,
            "raw_text": pytesseract.image_to_string(gray)
        }
