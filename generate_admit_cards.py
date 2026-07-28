import json
import re
from pathlib import Path

from PyPDF2 import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parent
SOURCE_PDF = ROOT / "BA-3-year-NEP.pdf"
STUDENTS_JSON = ROOT / "students.json"
OUTPUT_DIR = ROOT / "admitcards"


def safe_filename(value):
    return re.sub(r"[^A-Za-z0-9_-]+", "_", str(value)).strip("_")


def main():
    students = json.loads(STUDENTS_JSON.read_text(encoding="utf-8"))
    reader = PdfReader(str(SOURCE_PDF))

    if len(reader.pages) != len(students):
        raise RuntimeError(
            f"PDF page count ({len(reader.pages)}) does not match student count ({len(students)})."
        )

    OUTPUT_DIR.mkdir(exist_ok=True)

    created = 0
    for index, student in enumerate(students):
        roll_no = student.get("roll_no") or student.get("roll") or student.get("admit_card_no")
        if not roll_no:
            raise RuntimeError(f"Student at index {index} does not have an admit card number.")

        page = reader.pages[index]
        page_text = page.extract_text() or ""
        if str(roll_no) not in page_text:
            raise RuntimeError(f"Roll number {roll_no} was not found on PDF page {index + 1}.")

        writer = PdfWriter()
        writer.add_page(page)

        output_path = OUTPUT_DIR / f"{safe_filename(roll_no)}.pdf"
        with output_path.open("wb") as output_file:
            writer.write(output_file)

        created += 1

    print(f"Created {created} admit card PDFs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
