from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List
import uuid
import os
import shutil
from ..core.database import get_session
from ..core.config import settings
from ..models.models import Document, User, Edit
from ..schemas.schemas import DocumentRead, EditCreate, EditRead
from ..api.deps import get_current_user
from ..services.pdf_service import PDFService
from ..services.ocr_service import OCRService
from ..services.edit_service import EditService
from ..services.report_service import ReportService

router = APIRouter()

@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    document_id = uuid.uuid4()
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")
    
    # Ensure directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Initial analysis
    analysis = PDFService.analyze_pdf(file_path)
    
    db_document = Document(
        id=document_id,
        filename=file.filename,
        original_path=file_path,
        file_size=os.path.getsize(file_path),
        page_count=analysis["page_count"],
        status="ready",
        is_scanned=analysis["is_scanned"],
        confidence=analysis["confidence"],
        owner_id=current_user.id
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.get("/", response_model=List[DocumentRead])
def list_documents(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Document).where(Document.owner_id == current_user.id)
    results = db.exec(statement)
    return results.all()

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.post("/{document_id}/edit", response_model=EditRead)
def create_edit(
    document_id: uuid.UUID,
    edit_in: EditCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db_edit = Edit(
        **edit_in.model_dump(),
        document_id=document_id,
        user_id=current_user.id
    )
    db.add(db_edit)
    db.commit()
    db.refresh(db_edit)
    return db_edit

@router.post("/{document_id}/export")
def export_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get all edits
    statement = select(Edit).where(Edit.document_id == document_id).order_by(Edit.created_at)
    edits = db.exec(statement).all()
    
    output_filename = f"fixed_{document.filename}"
    output_path = os.path.join(settings.PROCESSED_DIR, f"{uuid.uuid4()}.pdf")
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
    
    EditService.apply_edits(document.original_path, edits, output_path)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=output_filename,
    )

@router.get("/{document_id}/page/{page_number}")
def get_page_image(
    document_id: uuid.UUID,
    page_number: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if page_number < 0 or page_number >= document.page_count:
        raise HTTPException(status_code=400, detail="Invalid page number")
        
    image_dir = os.path.join(settings.PROCESSED_DIR, str(document_id))
    os.makedirs(image_dir, exist_ok=True)
    image_path = os.path.join(image_dir, f"page_{page_number}.png")
    
    if not os.path.exists(image_path):
        PDFService.get_page_as_image(document.original_path, page_number, image_path)
    
    return FileResponse(image_path)

@router.get("/{document_id}/page/{page_number}/ocr")
def get_page_ocr(
    document_id: uuid.UUID,
    page_number: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    image_dir = os.path.join(settings.PROCESSED_DIR, str(document_id))
    os.makedirs(image_dir, exist_ok=True)
    image_path = os.path.join(image_dir, f"page_{page_number}.png")
    
    if not os.path.exists(image_path):
        PDFService.get_page_as_image(document.original_path, page_number, image_path)
    
    ocr_results = OCRService.extract_text_from_image(image_path)
    return ocr_results

@router.get("/{document_id}/report")
def get_document_report(
    document_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = db.get(Document, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get all edits
    statement = select(Edit).where(Edit.document_id == document_id).order_by(Edit.created_at)
    edits = db.exec(statement).all()
    
    report_buffer = ReportService.generate_audit_report(document, current_user, edits)
    
    return StreamingResponse(
        report_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=audit_report_{document.filename}"}
    )
