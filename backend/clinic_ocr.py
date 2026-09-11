import os
import io
import json
import logging
from typing import List, Dict, Any, Tuple
from PIL import Image

logger = logging.getLogger("clinic_ocr")

# Lazy load EasyOCR reader so startup is fast and memory is managed
_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR reader on CPU...")
            _easyocr_reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            logger.warning(f"EasyOCR initialization warning: {e}. Falling back to PyMuPDF text extractor.")
            _easyocr_reader = False
    return _easyocr_reader if _easyocr_reader is not False else None


def extract_ocr_from_file(file_path: str, file_type: str = "pdf") -> Tuple[List[Dict[str, Any]], int]:
    """
    Extract raw text lines with bounding boxes and confidence scores from a PDF or image file.
    Returns (raw_lines, page_count).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    raw_lines: List[Dict[str, Any]] = []
    page_count = 1

    if file_type.lower() == "pdf" or file_path.lower().endswith(".pdf"):
        raw_lines, page_count = _process_pdf(file_path)
    else:
        raw_lines = _process_image(file_path, page_num=1)

    return raw_lines, page_count


def _process_pdf(pdf_path: str) -> Tuple[List[Dict[str, Any]], int]:
    raw_lines = []
    page_count = 1

    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page_count = len(doc)

        for page_num in range(page_count):
            page = doc[page_num]
            
            # 1. Try vector text extraction with blocks
            blocks = page.get_text("blocks")
            extracted_words = page.get_text("words")  # [x0, y0, x1, y1, word, block_no, line_no, word_no]
            
            # Check if page has digital text stream
            has_digital_text = len(extracted_words) > 5

            if has_digital_text:
                # Digital PDF with selectable text
                for b in blocks:
                    text = b[4].strip()
                    if not text:
                        continue
                    # Split multi-line blocks into individual lines
                    for line in text.split("\n"):
                        clean = line.strip()
                        if clean:
                            raw_lines.append({
                                "text": clean,
                                "confidence": 0.98,
                                "bbox": [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]],
                                "page": page_num + 1,
                                "engine": "pymupdf_digital"
                            })
            else:
                reader = get_easyocr_reader()
                if reader:
                    # Scanned image PDF -> Rasterize page to high-res image and run EasyOCR
                    pix = page.get_pixmap(dpi=200)
                    img_bytes = pix.tobytes("png")
                    ocr_results = reader.readtext(img_bytes)
                    for bbox, text, conf in ocr_results:
                        clean = text.strip()
                        if clean:
                            raw_lines.append({
                                "text": clean,
                                "confidence": round(float(conf), 3),
                                "bbox": [[float(p[0]), float(p[1])] for p in bbox],
                                "page": page_num + 1,
                                "engine": "easyocr_raster"
                            })
                else:
                    # Fallback simple line text
                    for b in blocks:
                        text = b[4].strip()
                        if text:
                            for line in text.split("\n"):
                                clean = line.strip()
                                if clean:
                                    raw_lines.append({
                                        "text": clean,
                                        "confidence": 0.75,
                                        "bbox": [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]],
                                        "page": page_num + 1,
                                        "engine": "pymupdf_fallback"
                                    })

        doc.close()
    except Exception as e:
        logger.error(f"Error processing PDF with PyMuPDF: {e}")
        # Try image processing fallback if PyMuPDF failed
        raw_lines = _process_image(pdf_path, page_num=1)

    return raw_lines, page_count


def _process_image(image_path: str, page_num: int = 1) -> List[Dict[str, Any]]:
    raw_lines = []
    reader = get_easyocr_reader()

    if reader:
        try:
            results = reader.readtext(image_path)
            for bbox, text, conf in results:
                clean = text.strip()
                if clean:
                    raw_lines.append({
                        "text": clean,
                        "confidence": round(float(conf), 3),
                        "bbox": [[float(p[0]), float(p[1])] for p in bbox],
                        "page": page_num,
                        "engine": "easyocr"
                    })
            return raw_lines
        except Exception as e:
            logger.error(f"EasyOCR image processing failed: {e}")

    # Pure fallback if OCR fails or easyocr unavailable
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            w, h = img.size
            raw_lines.append({
                "text": f"[Image document: {os.path.basename(image_path)} ({w}x{h})]",
                "confidence": 0.70,
                "bbox": [[0, 0], [w, 0], [w, h], [0, h]],
                "page": page_num,
                "engine": "image_metadata"
            })
    except Exception as ex:
        logger.error(f"Fallback image metadata failed: {ex}")

    return raw_lines
