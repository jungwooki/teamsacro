"""Match an authorized team-dashboard API snapshot to the workbook roster.

Usage: python3 import_live_snapshot.py /path/to/reports.json
The input contains year-keyed /team-dashboard/reports responses, never tokens.
"""
import json
import sys
from pathlib import Path

root = Path(__file__).parent
players = json.loads((root / 'data.js').read_text().split('=', 1)[1].strip().removesuffix(';'))
snapshots = json.loads(Path(sys.argv[1]).read_text())
result = {}
matched = set()
for year, snapshot in snapshots.items():
    if '아크로' not in snapshot['team']['name']:
        raise ValueError('Unexpected team')
    mapped = {}
    for row in snapshot['rows']:
        candidates = [p for p in players if p['name'] == row['name'] and p['birth'] == row['birth_date'][:10] and p['tested'] == row['test_date'][:10]]
        if len(candidates) != 1:
            raise ValueError('Non-unique workbook match: ' + row['name'])
        player = candidates[0]
        if player['code'] in matched:
            raise ValueError('Duplicate athlete')
        matched.add(player['code'])
        coach = row['coach']
        mapped[player['code']] = {
            'name': player['name'], 'availability': coach['availability'],
            'coachScore': coach['coach_score'], 'stageScore': coach['stage_score'],
            'stageLabel': coach['stage_label'],
        }
    stats = snapshot['stats']
    result[year] = {
        'selection': snapshot['selection'],
        'stats': {key: stats[key] for key in ['total_count', 'availability', 'coach_score', 'risk_count', 'growth_spurt_count', 'mental']},
        'players': mapped,
    }
if matched != {p['code'] for p in players}:
    raise ValueError('Snapshot must cover the entire workbook roster')
(root / 'live-summary.js').write_text(
    '// Source: sportsmps.com/team-dashboard, AcroFC account, 2026-10-13.\n'
    '// Matched by name, birth date and test date to workbook chart numbers.\n'
    'const LIVE_SUMMARY = ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('Imported', len(matched), 'matched athletes; no credentials stored.')
