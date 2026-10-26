from pathlib import Path
p=Path('restoration/scripts/atlas.py');s=p.read_text(encoding='utf-8-sig').replace("if o.name in ['Object_9','Object_28','Object_14','Object_15']:continue", "if o.name not in ['Object_8','Object_13','Object_23','Object_27']:continue").replace("'DS_source_detail_normal',width=1024,height=1024", "'DS_source_detail_normal',width=512,height=512")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig').replace("low=[o for o in obs if o.name not in ['Object_9','Object_28','Object_14','Object_15']]", "low=[o for o in obs if o.name in ['Object_8','Object_13','Object_23','Object_27']]")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/render.py');s=p.read_text(encoding='utf-8-sig').replace("camera.data.ortho_scale=1.55", "camera.data.ortho_scale=1.75 if id=='ds-console' else 1.55")
p.write_text(s,encoding='utf-8')
