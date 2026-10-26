from pathlib import Path
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("['lambert6','lambert7','lambert9','typeBlinn']", "['lambert6','lambert7']")
s=s.replace("elif m.name in ['lambert1','lambert12','lambert13']:plastic(m,'77767c',.65)", "elif m.name=='lambert1':plastic(m,'aaa8ac',.65)\n   elif m.name in ['lambert12','lambert13']:plastic(m,'4c4b52',.65)\n   elif m.name in ['lambert9','typeBlinn']:plastic(m,'34305c',.65)")
s=s.replace("  for o in obs:\n   if o.name.startswith('typeMesh')", "  # The source displays a 3:2 image on a 4:3 screen; correct the internal aperture only.\n  for name in ['pCube16_blinn2_0','pCube21_lambert10_0']:\n   o=bpy.data.objects.get(name)\n   if o:\n    inverse=o.matrix_world.inverted(); bb=bounds([o]); cz=bb['center'][2]\n    for v in o.data.vertices:\n     co=o.matrix_world@v.co; co.z=cz+(co.z-cz)*8/9; v.co=inverse@co\n  for o in obs:\n   if o.name.startswith('typeMesh')")
s=s.replace("reduced geometric wordmark tessellation.", "3:2 display aperture without changing UVs; reduced geometric wordmark tessellation.")
p.write_text(s,encoding='utf-8')
