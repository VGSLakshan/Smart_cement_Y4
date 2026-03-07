from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.hirumi.hirumi_schemas import (
    CementDataInput,
    StrengthPrediction,
    PredictionResponse
)
from app.services.hirumi.model_service import get_model_service
from pydantic import BaseModel
from typing import List
import logging
import io
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/hirumi",
    tags=["Hirumi - Cement Strength Prediction"]
)


@router.get("/info")
async def get_model_info():
    """Get information about the Hirumi cement strength prediction model"""
    return {
        "success": True,
        "model_name": "Hirumi Cement Strength Predictor",
        "model_type": "Ensemble (XGBoost + LightGBM)",
        "description": "Multi-output gradient boosting model for predicting cement compressive strength",
        "targets": ["1D", "2D", "7D", "28D", "56D"],
        "features": [
            "Initial grinding time",
            "Final grinding time",
            "Residue 45µm",
            "Fineness",
            "L.O.I.",
            "Chemical compositions (SiO2, Al2O3, Fe2O3, CaO, MgO, SO3, K2O, Na2O, Cl)"
        ],
        "feature_engineering": "Yes - 30+ engineered features including interactions, ratios, and transformations",
        "version": "1.0.0"
    }


@router.post("/predict", response_model=PredictionResponse)
async def predict_strength(input_data: CementDataInput):
    """
    Predict cement compressive strength for multiple time periods (1D, 2D, 7D, 28D, 56D)
    
    Takes cement composition and grinding parameters as input and returns predicted
    compressive strengths using an ensemble of XGBoost and LightGBM models.
    """
    try:
        # Get model service
        model_service = get_model_service()
        
        # Convert input to dict
        input_dict = input_data.model_dump()
        
        # Make predictions
        predictions = model_service.predict(input_dict)
        
        # Create response
        strength_prediction = StrengthPrediction(
            strength_1d=predictions['1D'],
            strength_2d=predictions['2D'],
            strength_7d=predictions['7D'],
            strength_28d=predictions['28D'],
            strength_56d=predictions['56D'],
            model_used="Ensemble (XGBoost + LightGBM)",
            confidence="High"
        )
        
        response = PredictionResponse(
            success=True,
            message="Prediction completed successfully",
            input_data=input_data,
            predictions=strength_prediction,
            engineered_features_count=len(model_service.feature_columns)
        )
        
        logger.info(f"Prediction successful: {predictions}")
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/batch-predict")
async def batch_predict(inputs: list[CementDataInput]):
    """
    Predict cement strength for multiple samples at once
    """
    try:
        model_service = get_model_service()
        
        results = []
        for input_data in inputs:
            input_dict = input_data.model_dump()
            predictions = model_service.predict(input_dict)
            
            results.append({
                "input": input_dict,
                "predictions": {
                    "1D": predictions['1D'],
                    "2D": predictions['2D'],
                    "7D": predictions['7D'],
                    "28D": predictions['28D'],
                    "56D": predictions['56D']
                }
            })
        
        return {
            "success": True,
            "message": f"Batch prediction completed for {len(results)} samples",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.get("/model-performance")
async def get_model_performance():
    """Get model performance metrics"""
    try:
        model_service = get_model_service()
        
        # Load performance metrics from config if available
        import json
        from pathlib import Path
        
        config_path = Path(__file__).parent.parent.parent.parent / 'ml_models' / 'hirumi' / 'model_config.json'
        
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                performance_metrics = config.get('performance_metrics', [])
                
            return {
                "success": True,
                "metrics": performance_metrics,
                "message": "Performance metrics retrieved successfully"
            }
        else:
            return {
                "success": False,
                "message": "Performance metrics not available"
            }
            
    except Exception as e:
        logger.error(f"Error retrieving performance metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve performance metrics: {str(e)}"
        )


class ReportRequest(BaseModel):
    """Schema for report generation request"""
    predictionIds: List[str]


@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    """
    Generate a PDF report for selected cement strength predictions
    
    Fetches prediction data from MongoDB and generates a comprehensive PDF report
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        import pymongo
        from bson import ObjectId
        
        # Connect to MongoDB Atlas
        MONGODB_URI = "mongodb+srv://cement:12345@cementy4.uermlni.mongodb.net/smart_cement_db?retryWrites=true&w=majority"
        client = pymongo.MongoClient(MONGODB_URI)
        db = client["smart_cement_db"]
        collection = db["cementstrengthpredictions"]
        
        # Fetch predictions
        predictions = []
        for pred_id in request.predictionIds:
            try:
                pred = collection.find_one({"_id": ObjectId(pred_id)})
                if pred:
                    predictions.append(pred)
            except Exception as e:
                logger.warning(f"Could not fetch prediction {pred_id}: {str(e)}")
        
        if not predictions:
            raise HTTPException(status_code=404, detail="No predictions found")
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                              rightMargin=50, leftMargin=50,
                              topMargin=50, bottomMargin=50)
        
        # Container for PDF elements
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#dc2626'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        normal_style = styles['Normal']
        
        # Title
        title = Paragraph("Cement Strength Prediction Report", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # Report info
        report_info = f"""
        <b>Report Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>Number of Predictions:</b> {len(predictions)}<br/>
        <b>Model:</b> Ensemble (XGBoost + LightGBM)
        """
        elements.append(Paragraph(report_info, normal_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Process each prediction
        for idx, pred in enumerate(predictions, 1):
            # Prediction header
            pred_header = Paragraph(f"Prediction #{idx}", heading_style)
            elements.append(pred_header)
            
            # Date
            created_at = pred.get('createdAt', 'N/A')
            if created_at != 'N/A':
                date_str = created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(created_at, 'strftime') else str(created_at)
            else:
                date_str = 'N/A'
            
            elements.append(Paragraph(f"<b>Date:</b> {date_str}", normal_style))
            elements.append(Spacer(1, 0.1*inch))
            
            # Input Parameters Table
            elements.append(Paragraph("Input Parameters", heading_style))
            
            input_params = pred.get('inputParameters', {})
            grinding = input_params.get('grinding', {})
            chemical = input_params.get('chemicalComposition', {})
            
            input_data = [
                ['Parameter', 'Value', 'Unit'],
                ['Initial Grinding Time', str(grinding.get('initial_min', 'N/A')), 'min'],
                ['Final Grinding Time', str(grinding.get('final_min', 'N/A')), 'min'],
                ['Residue 45µm', str(grinding.get('residue_45um', 'N/A')), '%'],
                ['Fineness', str(grinding.get('fineness', 'N/A')), 'cm²/g'],
                ['L.O.I.', str(grinding.get('loi', 'N/A')), '%'],
                ['SiO2', str(chemical.get('sio2', 'N/A')), '%'],
                ['Al2O3', str(chemical.get('al2o3', 'N/A')), '%'],
                ['Fe2O3', str(chemical.get('fe2o3', 'N/A')), '%'],
                ['CaO', str(chemical.get('cao', 'N/A')), '%'],
                ['MgO', str(chemical.get('mgo', 'N/A')), '%'],
                ['SO3', str(chemical.get('so3', 'N/A')), '%'],
                ['K2O', str(chemical.get('k2o', 'N/A')), '%'],
                ['Na2O', str(chemical.get('na2o', 'N/A')), '%'],
                ['Cl', str(chemical.get('cl', 'N/A')), '%'],
            ]
            
            input_table = Table(input_data, colWidths=[3*inch, 1.5*inch, 1*inch])
            input_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(input_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # Prediction Results Table
            elements.append(Paragraph("Predicted Compressive Strength", heading_style))
            
            predictions_data = pred.get('predictions', {})
            
            results_data = [
                ['Time Period', 'Strength (MPa)', 'Confidence'],
                ['1 Day', f"{predictions_data.get('strength_1d', 'N/A'):.2f}" if predictions_data.get('strength_1d') else 'N/A', predictions_data.get('confidence', 'N/A')],
                ['2 Days', f"{predictions_data.get('strength_2d', 'N/A'):.2f}" if predictions_data.get('strength_2d') else 'N/A', predictions_data.get('confidence', 'N/A')],
                ['7 Days', f"{predictions_data.get('strength_7d', 'N/A'):.2f}" if predictions_data.get('strength_7d') else 'N/A', predictions_data.get('confidence', 'N/A')],
                ['28 Days', f"{predictions_data.get('strength_28d', 'N/A'):.2f}" if predictions_data.get('strength_28d') else 'N/A', predictions_data.get('confidence', 'N/A')],
                ['56 Days', f"{predictions_data.get('strength_56d', 'N/A'):.2f}" if predictions_data.get('strength_56d') else 'N/A', predictions_data.get('confidence', 'N/A')],
            ]
            
            results_table = Table(results_data, colWidths=[2*inch, 2*inch, 1.5*inch])
            results_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),  # Highlight 28-day
            ]))
            
            elements.append(results_table)
            
            # Add page break between predictions (except for last one)
            if idx < len(predictions):
                elements.append(PageBreak())
            else:
                elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_text = """
        <b>Note:</b> This report is generated by the Smart Cement Platform AI-Powered Prediction System.
        The predictions are based on machine learning models trained on historical data and should be used
        for reference purposes. Actual results may vary based on production conditions.
        """
        elements.append(Paragraph(footer_text, normal_style))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF from buffer
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=cement_strength_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
        
    except ImportError as e:
        logger.error(f"Missing required library: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF generation library not available. Please install reportlab."
        )
    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )
