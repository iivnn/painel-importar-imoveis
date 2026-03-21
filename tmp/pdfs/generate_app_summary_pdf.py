from pathlib import Path


PAGE_WIDTH = 595
PAGE_HEIGHT = 842


def pdf_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def text_line(x: int, y: int, text: str, size: int = 11, font: str = "F1") -> str:
    encoded = pdf_escape(text)
    return f"BT /{font} {size} Tf 1 0 0 1 {x} {y} Tm ({encoded}) Tj ET"


def horizontal_rule(y: int, x1: int = 54, x2: int = 541) -> str:
    return f"{x1} {y} m {x2} {y} l S"


def build_content() -> str:
    lines = []

    # High-contrast layout for readability
    lines.append("1 1 1 rg")
    lines.append("42 54 511 734 re f")
    lines.append("0.93 0.95 0.98 rg")
    lines.append("54 658 487 112 re f")
    lines.append("0.12 0.22 0.38 RG")
    lines.append("2.5 w")
    lines.append("54 658 487 112 re S")
    lines.append("0.18 0.18 0.18 RG")
    lines.append("1.2 w")
    lines.append(horizontal_rule(642))

    y = 734
    lines.append("0.05 0.08 0.14 rg")
    lines.append(text_line(68, y, "App Summary", 24, "F2"))
    lines.append("0.15 0.15 0.15 rg")
    lines.append(text_line(68, y - 26, "One-page overview for a local rental listing tracker", 11))

    # What it is
    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 606, "What it is", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 588, "- Aplicacao local para cadastrar imoveis de aluguel encontrados em outros apps.", 10))
    lines.append(text_line(84, 572, "- Inclui uma analise SWOT para apoiar a comparacao dos anuncios.", 10))

    # Audience + value
    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 538, "Who it's for", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 520, "- Uso pessoal.", 10))

    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 490, "What it does", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 472, "- Cadastra anuncios manualmente.", 10))
    lines.append(text_line(84, 456, "- Categoriza os imoveis para facilitar filtro e comparacao.", 10))
    lines.append(text_line(84, 440, "- Mostra a localizacao em mapa.", 10))

    # How it works
    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 406, "How it works", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 388, "- Executa localmente e salva os dados localmente.", 10))
    lines.append(text_line(84, 372, "- Fluxo esperado: registrar anuncio, classificar e revisar SWOT.", 10))

    # Run info
    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 338, "How to run", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 320, "- Acesso previsto via localhost.", 10))

    # Repo check
    lines.append("0.06 0.12 0.22 rg")
    lines.append(text_line(68, 286, "Repo check", 14, "F2"))
    lines.append("0.08 0.08 0.08 rg")
    lines.append(text_line(84, 268, "- Source files/docs: Not found in repo.", 10))
    lines.append(text_line(84, 252, "- Tech stack and startup command: Not found in repo.", 10))
    lines.append(text_line(84, 236, "- Storage format and map provider: Not found in repo.", 10))

    # Footer note
    lines.append("0.18 0.18 0.18 rg")
    lines.append(text_line(68, 102, "Prepared from the user brief plus a repo scan. Layout intentionally compact to stay on one page.", 9))

    return "\n".join(lines) + "\n"


def write_pdf(output_path: Path) -> None:
    content = build_content().encode("latin-1", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>".encode(
            "ascii"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        f"<< /Length {len(content)} >>\nstream\n".encode("ascii") + content + b"endstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{idx} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        pdf.extend(f"{off:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(pdf)


if __name__ == "__main__":
    destination = Path("output/pdf/app-summary.pdf")
    write_pdf(destination)
    print(destination.resolve())
