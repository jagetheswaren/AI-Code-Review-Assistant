import json
import csv
import io
from flask import Blueprint, request, jsonify, g, make_response
from functools import wraps
from database.mongodb import scan_service
from auth.jwt_auth import decode_token

export_bp = Blueprint('export', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated


def _get_scan_data(scan_id, user_id):
    scan = scan_service.get_scan_by_id(scan_id)
    if not scan or str(scan.user_id) != user_id:
        return None, None
    data = scan.model_dump(by_alias=True, mode="json")
    return scan, data


@export_bp.route('/api/export/json/<scan_id>', methods=['GET'])
@token_required
def export_json(scan_id):
    user_id = g.current_user['user_id']
    scan, data = _get_scan_data(scan_id, user_id)
    if not data:
        return jsonify({"error": "Report not found"}), 404

    response = make_response(json.dumps(data, indent=2, default=str))
    response.headers['Content-Type'] = 'application/json'
    response.headers['Content-Disposition'] = f'attachment; filename="report_{scan_id[:8]}.json"'
    return response


@export_bp.route('/api/export/csv/<scan_id>', methods=['GET'])
@token_required
def export_csv(scan_id):
    user_id = g.current_user['user_id']
    scan, data = _get_scan_data(scan_id, user_id)
    if not data:
        return jsonify({"error": "Report not found"}), 404

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["File", "Line", "Type", "Severity", "Rule ID", "Message", "Suggestion", "Explanation", "Fix Suggestion"])

    for fa in data.get("file_analyses", []):
        for issue in fa.get("issues", []):
            writer.writerow([
                fa.get("file_path", ""),
                issue.get("line_number", ""),
                issue.get("type", ""),
                issue.get("severity", ""),
                issue.get("rule_id", ""),
                issue.get("message", ""),
                issue.get("suggestion", ""),
                issue.get("explanation", ""),
                issue.get("fix_suggestion", "")
            ])

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename="report_{scan_id[:8]}.csv"'
    return response


@export_bp.route('/api/export/pdf/<scan_id>', methods=['GET'])
@token_required
def export_pdf(scan_id):
    user_id = g.current_user['user_id']
    scan, data = _get_scan_data(scan_id, user_id)
    if not data:
        return jsonify({"error": "Report not found"}), 404

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import inch

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=12)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=8)
        body_style = ParagraphStyle('CustomBody', parent=styles['Normal'], fontSize=10, spaceAfter=6)

        elements = []

        elements.append(Paragraph("IntelliReview AI - Code Analysis Report", title_style))
        elements.append(Spacer(1, 12))

        summary = data.get("summary", {})
        elements.append(Paragraph("Summary", heading_style))
        elements.append(Paragraph(f"Total Issues: {summary.get('total_issues', 0)}", body_style))
        elements.append(Paragraph(f"Overall Risk: {summary.get('overall_risk', 'none').upper()}", body_style))

        by_type = summary.get("by_type", {})
        if by_type:
            type_data = [["Type", "Count"]]
            for t, c in by_type.items():
                type_data.append([t.replace("_", " ").title(), str(c)])
            type_table = Table(type_data, colWidths=[3 * inch, 1.5 * inch])
            type_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
            ]))
            elements.append(type_table)
            elements.append(Spacer(1, 12))

        elements.append(Paragraph("Issues Detail", heading_style))
        for fa in data.get("file_analyses", []):
            elements.append(Paragraph(f"File: {fa.get('file_path', 'unknown')}", body_style))
            for issue in fa.get("issues", []):
                sev = issue.get("severity", "info").upper()
                sev_color = {"CRITICAL": colors.red, "HIGH": colors.orange, "MEDIUM": colors.gold, "LOW": colors.green, "INFO": colors.blue}.get(sev, colors.grey)
                line_text = f"[{sev}] Line {issue.get('line_number', '?')}: {issue.get('message', '')}"
                style = ParagraphStyle('Issue', parent=body_style, textColor=sev_color, fontSize=9)
                elements.append(Paragraph(line_text, style))
                if issue.get("suggestion"):
                    elements.append(Paragraph(f"  Fix: {issue['suggestion']}", ParagraphStyle('Fix', parent=body_style, fontSize=8, leftIndent=20)))
            elements.append(Spacer(1, 6))

        if data.get("ai_review"):
            elements.append(Paragraph("AI Review", heading_style))
            elements.append(Paragraph(data["ai_review"], body_style))

        doc.build(elements)
        buffer.seek(0)

        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="report_{scan_id[:8]}.pdf"'
        return response

    except ImportError:
        return jsonify({"error": "PDF export requires reportlab. Install with: pip install reportlab"}), 501
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500
