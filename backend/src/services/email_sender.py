"""Email sender using Resend for crime intelligence reports."""

from __future__ import annotations

from datetime import datetime
from typing import List

import resend

from core.logging import get_logger
from core.settings import get_settings

LOGGER = get_logger(__name__)


def send_report_email(report_markdown: str) -> None:
    """Send crime intelligence report via Resend to configured recipients."""
    settings = get_settings()
    
    if not settings.resend_api_key:
        raise ValueError("RESEND_API_KEY is not configured")
    
    if not settings.recipients:
        raise ValueError("RECIPIENTS is not configured")
    
    resend.api_key = settings.resend_api_key
    
    recipients = [email.strip() for email in settings.recipients.split(",")]
    
    subject = f"Crime Intelligence Brief – {datetime.now().strftime('%B %d, %Y')}"
    
    html_content = _markdown_to_html(report_markdown)
    
    LOGGER.info(f"Sending report to {len(recipients)} recipients")
    
    try:
        for recipient in recipients:
            params = {
                "from": "Crime Intelligence <cyberintelligence@nightshadeai.xyz>",
                "to": [recipient],
                "subject": subject,
                "text": report_markdown,
                "html": html_content,
            }
            
            email = resend.Emails.send(params)
            LOGGER.info(f"Sent email to {recipient}: {email.get('id')}")
        
        LOGGER.info("All emails sent successfully")
    except Exception as e:
        LOGGER.error(f"Failed to send emails: {e}")
        raise


def _markdown_to_html(markdown: str) -> str:
    """Convert markdown to professional HTML email format."""
    lines = markdown.split("\n")
    
    html_parts = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }",
        ".container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }",
        "h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 10px; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }",
        "h2 { color: #dc2626; font-size: 22px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #dc2626; padding-left: 12px; }",
        "h3 { color: #374151; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }",
        "p { margin: 10px 0; color: #4b5563; }",
        "ul { margin: 10px 0; padding-left: 25px; }",
        "li { margin: 8px 0; color: #4b5563; }",
        ".timestamp { color: #6b7280; font-style: italic; font-size: 14px; margin-bottom: 20px; }",
        ".footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }",
        "</style>",
        "</head>",
        "<body>",
        "<div class='container'>",
    ]
    
    in_list = False
    
    for line in lines:
        line = line.strip()
        
        if line.startswith("# "):
            html_parts.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("*") and line.endswith("*") and not line.startswith("**"):
            html_parts.append(f"<p class='timestamp'>{line[1:-1]}</p>")
        elif line.startswith("## "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("### "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h3>{line[4:]}</h3>")
        elif line.startswith("- "):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{line[2:]}</li>")
        elif line.startswith("* ") and not line.endswith("*"):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{line[2:]}</li>")
        elif line:
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<p>{line}</p>")
    
    if in_list:
        html_parts.append("</ul>")
    
    html_parts.extend([
        "<div class='footer'>",
        "<p>Crime Intelligence Report | Automated by Informa</p>",
        "<p>This is an automated email. Please do not reply.</p>",
        "</div>",
        "</div>",
        "</body>",
        "</html>",
    ])
    
    return "\n".join(html_parts)

