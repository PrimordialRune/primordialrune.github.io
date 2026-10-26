from pathlib import Path
p=Path('restoration/scripts/run.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace(" for suffix,path in [('before'", " render_jobs=[('before'")
s=s.replace("else []):\n  run([BLENDER", "else [])\n if id=='crossfader-cassette':render_jobs.append(('after_side_b',ROOT/'work'/(id+'-render.glb')))\n for suffix,path in render_jobs:\n  run([BLENDER")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/validate.mjs');s=p.read_text(encoding='utf-8-sig').replace("if(report.compressed.issues.numErrors||report.decoded.issues.numErrors)process.exitCode=1;", "if(['compressed','decoded'].some(k=>report[k].issues.numErrors||report[k].issues.numWarnings))process.exitCode=1;");p.write_text(s,encoding='utf-8')
