# Professional-Email-HTML-Templates

## Purpose
Create professional, email-client-compatible HTML templates from markdown content with modern styling.

## What This Teaches

- Email-safe CSS (inline styles, no external resources)
- Responsive design for email (max-width containers, system fonts)
- Markdown-to-HTML conversion with proper list handling
- Typography and color schemes for official communications
- Footer patterns with disclaimers and branding

## Key Dependencies

No external dependencies required - uses pure Python string manipulation.

## Core Implementation Pattern

### 1. Email-Safe HTML Structure

```python
def _markdown_to_html(markdown: str) -> str:
    """Convert markdown to professional HTML email format."""
    html_parts = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        "<style>",
        # All CSS goes here (inline in <style> tag)
        "</style>",
        "</head>",
        "<body>",
        "<div class='container'>",
        # Content goes here
        "</div>",
        "</body>",
        "</html>",
    ]
    return "\n".join(html_parts)
```

### 2. Email-Safe CSS Styling

**CRITICAL**: Email clients strip external CSS and many modern CSS features.

```python
style_rules = [
    # System font stack for universal compatibility
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }",
    
    # White card with shadow
    ".container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }",
    
    # Title with bottom border (crime/alert theme)
    "h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 10px; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }",
    
    # Section headers with left accent
    "h2 { color: #dc2626; font-size: 22px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #dc2626; padding-left: 12px; }",
    
    # Subsection headers
    "h3 { color: #374151; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }",
    
    # Body text
    "p { margin: 10px 0; color: #4b5563; }",
    
    # Lists
    "ul { margin: 10px 0; padding-left: 25px; }",
    "li { margin: 8px 0; color: #4b5563; }",
    
    # Timestamp styling
    ".timestamp { color: #6b7280; font-style: italic; font-size: 14px; margin-bottom: 20px; }",
    
    # Footer
    ".footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }",
]
```

### 3. Markdown Parsing with List Tracking

```python
lines = markdown.split("\n")
in_list = False

for line in lines:
    line = line.strip()
    
    # Handle title
    if line.startswith("# "):
        html_parts.append(f"<h1>{line[2:]}</h1>")
    
    # Handle timestamp (italic text between asterisks)
    elif line.startswith("*") and line.endswith("*") and not line.startswith("**"):
        html_parts.append(f"<p class='timestamp'>{line[1:-1]}</p>")
    
    # Handle section headers
    elif line.startswith("## "):
        if in_list:
            html_parts.append("</ul>")
            in_list = False
        html_parts.append(f"<h2>{line[3:]}</h2>")
    
    # Handle subsection headers
    elif line.startswith("### "):
        if in_list:
            html_parts.append("</ul>")
            in_list = False
        html_parts.append(f"<h3>{line[4:]}</h3>")
    
    # Handle list items (both - and *)
    elif line.startswith("- ") or (line.startswith("* ") and not line.endswith("*")):
        if not in_list:
            html_parts.append("<ul>")
            in_list = True
        content = line[2:]
        html_parts.append(f"<li>{content}</li>")
    
    # Handle regular paragraphs
    elif line:
        if in_list:
            html_parts.append("</ul>")
            in_list = False
        html_parts.append(f"<p>{line}</p>")

# Close list if still open
if in_list:
    html_parts.append("</ul>")
```

### 4. Professional Footer

```python
footer = [
    "<div class='footer'>",
    "<p>Crime Intelligence Report | Automated by Informa</p>",
    "<p>This is an automated email. Please do not reply.</p>",
    "</div>",
]
html_parts.extend(footer)
```

## Complete Implementation

```python
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
```

## Common Pitfalls

### 1. External CSS/Resources
```html
<!-- ❌ WRONG - External CSS stripped by email clients -->
<link rel="stylesheet" href="styles.css">

<!-- ✅ CORRECT - Inline in <style> tag -->
<style>
body { font-family: Arial, sans-serif; }
</style>
```

### 2. Modern CSS Features
```css
/* ❌ WRONG - Not supported in email */
display: grid;
flex: 1;
@media (max-width: 600px) { }

/* ✅ CORRECT - Email-safe */
max-width: 800px;
margin: 0 auto;
padding: 20px;
```

### 3. Forgetting to Close Lists
```python
# ❌ WRONG - List never closes
for line in lines:
    if line.startswith("- "):
        html_parts.append("<li>...</li>")

# ✅ CORRECT - Close list after loop
if in_list:
    html_parts.append("</ul>")
```

## Color Scheme Guidelines

**Crime/Alert Theme** (Red accents for urgency):
- Primary: `#dc2626` (red-600)
- Text: `#1a1a1a` (near black)
- Secondary text: `#4b5563` (gray-600)
- Muted text: `#6b7280` (gray-500)
- Background: `#f5f5f5` (gray-100)
- Container: `white`

## Email Client Compatibility

Tested and works in:
- ✅ Gmail (web, mobile)
- ✅ Outlook (2016+, web)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Proton Mail

## Testing Strategy

1. **Render test**: Convert sample markdown, view in browser
2. **Email test**: Send to multiple email clients
3. **Mobile test**: Check on mobile devices
4. **Dark mode test**: Verify readability in dark mode

## Complete Example

See: `backend/src/services/email_sender.py`

## References

- [Email Client CSS Support](https://www.caniemail.com/)
- [Email on Acid](https://www.emailonacid.com/)
- [Litmus Email Previews](https://www.litmus.com/)

