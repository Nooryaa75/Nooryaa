import { execFileSync } from 'node:child_process';

// Use Apple's plist format through Python's standard library, preserving
// existing URL schemes (including any future social sign-in callbacks).
execFileSync('python3', ['-c', `
import plistlib
from pathlib import Path
path = Path('ios/App/App/Info.plist')
if not path.exists():
    raise RuntimeError('Generate the iOS project before configuring deep links.')
with path.open('rb') as file:
    info = plistlib.load(file)
types = info.setdefault('CFBundleURLTypes', [])
if not any('nooryaa' in item.get('CFBundleURLSchemes', []) for item in types):
    types.append({'CFBundleURLName': 'com.nooryaa.app.open', 'CFBundleURLSchemes': ['nooryaa']})
with path.open('wb') as file:
    plistlib.dump(info, file, sort_keys=False)
with path.open('rb') as file:
    verified = plistlib.load(file)
if not any('nooryaa' in item.get('CFBundleURLSchemes', []) for item in verified.get('CFBundleURLTypes', [])):
    raise RuntimeError('Nooryaa iOS URL scheme was not applied.')
`], { stdio: 'inherit' });
console.log('Nooryaa iOS opening link configured.');