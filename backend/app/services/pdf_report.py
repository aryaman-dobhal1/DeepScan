"""
PDF forensic report generator using ReportLab.
Produces a professional multi-page report with:
  - Header with scan ID and verdict badge
  - Executive summary
  - Signal scores bar chart
  - Metadata findings table
  - Frame timeline (for video)
  - Grad-CAM heatmap (if available)
"""

import io
import base64
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, KeepTogether,
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Colour palette ──────────────────────────────────────────────────────────
C_BG       = colors.HexColor("#070810")
C_CARD     = colors.HexColor("#13162a")
C_BORDER   = colors.HexColor("#1e2240")
C_ACCENT   = colors.HexColor("#00f5c4")
C_ACCENT2  = colors.HexColor("#7c6fff")
C_DANGER   = colors.HexColor("#ff4f7b")
C_WARN     = colors.HexColor("#ffb830")
C_TEXT     = colors.HexColor("#e8eaf6")
C_MUTED    = colors.HexColor("#6b7299")
C_WHITE    = colors.white
C_BLACK    = colors.black


def _verdict_color(verdict: str) -> colors.Color:
    return C_DANGER if verdict == "DEEPFAKE" else C_WARN if verdict == "SUSPECT" else C_ACCENT


def _bar_color(key: str, value: float) -> colors.Color:
    if key == "skin_texture":
        return C_ACCENT if value < 40 else C_WARN
    return C_DANGER if value >= 70 else C_WARN if value >= 40 else C_ACCENT


def generate_pdf(scan: dict) -> bytes:
    """
    scan dict keys (from ScanRecord or ScanResponse):
      id, filename, file_type, fake_probability, verdict, confidence,
      signals (dict), metadata_findings (list of dicts),
      frame_data (list|None), summary, model_used,
      analysis_time_ms, created_at, heatmap_b64 (str|None)
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    W = A4[0] - 40*mm   # usable width

    # Custom styles
    title_style = ParagraphStyle("title", fontSize=22, textColor=C_TEXT,
                                  fontName="Helvetica-Bold", spaceAfter=2*mm)
    sub_style   = ParagraphStyle("sub",   fontSize=9,  textColor=C_MUTED,
                                  fontName="Courier",    spaceAfter=4*mm)
    body_style  = ParagraphStyle("body",  fontSize=10, textColor=C_TEXT,
                                  fontName="Helvetica",  leading=16, spaceAfter=4*mm)
    section_style = ParagraphStyle("section", fontSize=8, textColor=C_MUTED,
                                    fontName="Courier", spaceBefore=6*mm, spaceAfter=3*mm)

    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    verdict     = scan.get("verdict", "UNKNOWN")
    fake_prob   = scan.get("fake_probability", 0)
    v_color     = _verdict_color(verdict)

    # Title row
    header_data = [[
        Paragraph(f"<b>{scan.get('filename', 'Unknown File')}</b>", title_style),
        Paragraph(
            f'<font color="#{v_color.hexval()[2:]}"><b>⚠ {verdict}</b></font>'
            if verdict == "DEEPFAKE" else
            f'<font color="#{v_color.hexval()[2:]}"><b>{verdict}</b></font>',
            ParagraphStyle("verd", fontSize=14, fontName="Helvetica-Bold",
                           textColor=v_color, alignment=TA_RIGHT),
        ),
    ]]
    header_table = Table(header_data, colWidths=[W * 0.7, W * 0.3])
    header_table.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE")]))
    story.append(header_table)

    created = scan.get("created_at", datetime.utcnow())
    if isinstance(created, str):
        try: created = datetime.fromisoformat(created.replace("Z",""))
        except: created = datetime.utcnow()

    story.append(Paragraph(
        f"Report ID: DS-{scan.get('id','?')[:12].upper()} &nbsp;·&nbsp; "
        f"Model: {scan.get('model_used','—')} &nbsp;·&nbsp; "
        f"Analysed: {created.strftime('%d %b %Y %H:%M UTC')}",
        sub_style,
    ))
    story.append(HRFlowable(width=W, color=C_BORDER, thickness=0.5, spaceAfter=4*mm))

    # ── Fake probability large display ────────────────────────────────────────
    prob_data = [[
        Paragraph(f"<b>{fake_prob:.1f}%</b>",
                  ParagraphStyle("prob", fontSize=40, textColor=v_color,
                                 fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("FAKE PROBABILITY",
                  ParagraphStyle("pl", fontSize=8, textColor=C_MUTED,
                                 fontName="Courier", alignment=TA_CENTER)),
        Paragraph(f"Confidence: <b>{scan.get('confidence','—')}</b>",
                  ParagraphStyle("conf", fontSize=10, textColor=C_TEXT,
                                 fontName="Helvetica", alignment=TA_CENTER)),
    ]]
    # Stack vertically
    prob_block = Table([[
        Paragraph(f"<b>{fake_prob:.1f}%</b>",
                  ParagraphStyle("pb", fontSize=36, textColor=v_color,
                                 fontName="Helvetica-Bold", alignment=TA_CENTER)),
    ], [
        Paragraph("FAKE PROBABILITY",
                  ParagraphStyle("pbl", fontSize=7, textColor=C_MUTED,
                                 fontName="Courier", alignment=TA_CENTER)),
    ], [
        Paragraph(f"Confidence: {scan.get('confidence','—')} &nbsp;·&nbsp; "
                  f"File type: {scan.get('file_type','—').upper()} &nbsp;·&nbsp; "
                  f"Analysis: {scan.get('analysis_time_ms','—')}ms",
                  ParagraphStyle("meta", fontSize=8, textColor=C_MUTED,
                                 fontName="Courier", alignment=TA_CENTER)),
    ]], colWidths=[W])
    story.append(prob_block)
    story.append(Spacer(1, 4*mm))

    # ── Executive summary ─────────────────────────────────────────────────────
    story.append(Paragraph("// EXECUTIVE SUMMARY", section_style))
    story.append(Paragraph(scan.get("summary", "No summary available."), body_style))

    # ── Signal scores bar chart ───────────────────────────────────────────────
    story.append(Paragraph("// DETECTION SIGNALS", section_style))
    signals = scan.get("signals") or {}
    if isinstance(signals, object) and hasattr(signals, "__dict__"):
        signals = signals.__dict__
    if signals:
        signal_labels = {
            "gan_artifact":          "GAN Artifact Score",
            "facial_inconsistency":  "Facial Inconsistency",
            "blink_anomaly":         "Blink Anomaly",
            "skin_texture":          "Skin Texture Coherence",
            "frequency_shift":       "Frequency Domain Shift",
            "metadata_auth":         "Metadata Authenticity",
        }
        BAR_W = W - 60*mm
        rows = []
        for key, label in signal_labels.items():
            val = float(signals.get(key, 0))
            bc  = _bar_color(key, val)
            d = Drawing(BAR_W, 10)
            d.add(Rect(0, 2, BAR_W, 6, fillColor=C_BORDER, strokeColor=None))
            d.add(Rect(0, 2, BAR_W * val / 100, 6, fillColor=bc, strokeColor=None))
            rows.append([
                Paragraph(label, ParagraphStyle("sl", fontSize=8, textColor=C_TEXT,
                                                fontName="Helvetica")),
                d,
                Paragraph(f"{val:.0f}%", ParagraphStyle("sv", fontSize=8, textColor=C_MUTED,
                                                         fontName="Courier", alignment=TA_RIGHT)),
            ])
        sig_table = Table(rows, colWidths=[55*mm, BAR_W, 15*mm], rowHeights=7*mm)
        sig_table.setStyle(TableStyle([
            ("VALIGN",  (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 2),
            ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 4*mm))

    # ── Metadata findings table ───────────────────────────────────────────────
    story.append(Paragraph("// METADATA FORENSICS", section_style))
    findings = scan.get("metadata_findings") or []
    if findings:
        def _sev_color(sev):
            return C_DANGER if sev == "DANGER" else C_WARN if sev == "WARN" else C_ACCENT

        table_data = [[
            Paragraph("<b>Field</b>", ParagraphStyle("th", fontSize=8, textColor=C_MUTED, fontName="Courier")),
            Paragraph("<b>Value</b>", ParagraphStyle("th", fontSize=8, textColor=C_MUTED, fontName="Courier")),
            Paragraph("<b>Status</b>", ParagraphStyle("th", fontSize=8, textColor=C_MUTED, fontName="Courier")),
        ]]
        for f in findings:
            if isinstance(f, dict):
                field, value, status, sev = f.get("field",""), f.get("value",""), f.get("status",""), f.get("severity","OK")
            else:
                field, value, status, sev = f.field, f.value, f.status, f.severity
            sc = _sev_color(sev)
            table_data.append([
                Paragraph(field,  ParagraphStyle("td", fontSize=8, textColor=C_TEXT,  fontName="Courier")),
                Paragraph(value,  ParagraphStyle("td", fontSize=8, textColor=C_MUTED, fontName="Courier")),
                Paragraph(status, ParagraphStyle("td", fontSize=8, textColor=sc,      fontName="Courier", fontWeight="bold")),
            ])
        meta_table = Table(table_data, colWidths=[50*mm, 80*mm, 40*mm])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,0),  C_CARD),
            ("LINEBELOW",     (0,0), (-1,-1), 0.5, C_BORDER),
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 4*mm))

    # ── Heatmap (if available) ────────────────────────────────────────────────
    heatmap_b64 = scan.get("heatmap_b64")
    if heatmap_b64:
        story.append(Paragraph("// MANIPULATION HEATMAP (Grad-CAM)", section_style))
        img_data = base64.b64decode(heatmap_b64)
        img_buf  = io.BytesIO(img_data)
        rl_img   = RLImage(img_buf, width=80*mm, height=60*mm)
        story.append(rl_img)
        story.append(Spacer(1, 4*mm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width=W, color=C_BORDER, thickness=0.5, spaceBefore=6*mm))
    story.append(Paragraph(
        f"Generated by DeepScan v1.0 &nbsp;·&nbsp; "
        f"Model: {scan.get('model_used','—')} &nbsp;·&nbsp; "
        f"This report is for informational purposes only.",
        ParagraphStyle("footer", fontSize=7, textColor=C_MUTED,
                       fontName="Courier", alignment=TA_CENTER),
    ))

    doc.build(story)
    return buf.getvalue()
