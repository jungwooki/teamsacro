"""Import supplied authoring workbook rows into the local AcroFC dashboard.
Retain the reference dashboards PAH display interval without exporting its point estimate.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
COLUMNS = {
    "A": "name", "C": "birth", "D": "tested", "E": "code", "F": "team",
    "I": "height", "J": "weight", "K": "mgi", "L": "pressure",
    "M": "support", "N": "preparation", "O": "recovery", "P": "control",
    "Q": "stability", "R": "emotion", "S": "independence", "T": "learning",
    "U": "imagery", "V": "adaptation", "W": "resilience", "X": "attitude",
    "Y": "phv", "Z": "ecw", "AA": "bodyFat", "AB": "sdnn", "AC": "rmssd",
    "AG": "stress", "AH": "achillesLeft", "AI": "achillesRight",
    "AJ": "patellarLeft", "AK": "patellarRight", "AL": "plantarLeft",
    "AM": "plantarRight", "AN": "boneYears", "AO": "boneMonths",
    "AR": "growthStage", "G": "doctor", "H": "center",
}
NUMERIC = {"height", "weight", "mgi", "pressure", "support", "preparation", "recovery", "control", "stability", "emotion", "independence", "learning", "imagery", "adaptation", "resilience", "attitude", "ecw", "bodyFat", "sdnn", "rmssd", "stress", "boneYears", "boneMonths"}


def rows(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(n.text or "" for n in item.findall(".//m:t", NS)) for item in root.findall("m:si", NS)]
        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in root.findall(".//m:sheetData/m:row", NS)[3:]:
            result = {}
            for cell in row.findall("m:c", NS):
                column = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                value = cell.find("m:v", NS)
                inline = cell.find("m:is", NS)
                raw = value.text if value is not None else "".join(n.text or "" for n in inline.findall(".//m:t", NS)) if inline is not None else ""
                if cell.attrib.get("t") == "s" and raw:
                    raw = strings[int(raw)]
                result[column] = raw
            if result.get("A"):
                yield result


def main(paths):
    players = []
    for path in paths:
        for row in rows(path):
            player = {}
            for column, key in COLUMNS.items():
                value = row.get(column, "")
                player[key] = float(value) if key in NUMERIC and value not in ("", None) else value
            point = row.get("AS", "")
            player["heightRange"] = [round(float(point) - 1.5, 1), round(float(point) + 7.5, 1)] if point else None
            player["id"] = player["code"]
            players.append(player)
    if not players or any(not p["id"] for p in players) or len({p["id"] for p in players}) != len(players):
        raise ValueError("Expected nonempty athletes with unique chart numbers")
    output = Path(__file__).with_name("data.js")
    output.write_text("const TEAM_PLAYERS = " + json.dumps(players, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Imported {len(players)} athletes to {output.name}; PAH point estimates omitted")


if __name__ == "__main__":
    main([Path(p) for p in sys.argv[1:]])
