from pathlib import Path
p=Path('restoration/scripts/render.py');s=p.read_text(encoding='utf-8-sig').replace(" scene=bpy.context.scene\n obs=list(scene.objects)", " scene=bpy.context.scene\n # The room shows A or B by toggling the co-located authored letter nodes.\n # Apply the same initial visibility to both evidence files, without editing either GLB.\n if id=='crossfader-cassette':\n  hidden='LabelA' if suffix.endswith('side_b') else 'LabelB'\n  for o in scene.objects:\n   if o.name.startswith(hidden):o.hide_render=True\n obs=list(scene.objects)")
p.write_text(s,encoding='utf-8')
