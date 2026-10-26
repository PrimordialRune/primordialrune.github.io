"""Reproduce the complete pass after installing the locked Node dependencies."""
import os,sys
from run import ROOT,IDS,BLENDER,run,model
os.chdir(ROOT.parent)
for folder in ['out','renders','work']:(ROOT/folder).mkdir(exist_ok=True)
run([BLENDER,'-b','-t','6','-P',ROOT/'scripts/inventory.py'],'inventory.log')
for id in IDS:model(id)
run(['node',ROOT/'scripts/contact_sheet.mjs'],'overview.log')
run([sys.executable,ROOT/'scripts/report.py'],'report.log')
print('Restoration complete. See restoration/REPORT.md.',flush=True)
