"""Restore one original model in the web reference frame, with the web label materials.
Run: blender -b -t 6 -P restoration/scripts/restore.py -- gb-console
"""
import bpy, sys, json, math
from pathlib import Path
from mathutils import Vector, Matrix
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
from inventory import bounds
from glb_utils import static_file
ROOT=Path(__file__).resolve().parents[1]
ORIGINAL={'crossfader-player':'cassette_player','crossfader-cassette':'cassette_memory'}

def select_only(objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects: o.select_set(True)
 if objects: bpy.context.view_layer.objects.active=objects[0]

def srgb(hex):
 rgb=[int(hex[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4 for c in rgb)+(1,)

def principled(m):
 return next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m and m.use_nodes else None

def plastic(m,color=None,roughness=.62):
 p=principled(m)
 if not p:return
 if color:
  for l in list(p.inputs['Base Color'].links): m.node_tree.links.remove(l)
  p.inputs['Base Color'].default_value=srgb(color)
 p.inputs['Metallic'].default_value=0
 p.inputs['Roughness'].default_value=roughness
 p.inputs['Specular IOR Level'].default_value=.35


def apply_modifier(o,modifier):
 select_only([o]); bpy.ops.object.modifier_apply(modifier=modifier.name)

def collapse(o,ratio):
 if ratio>=1:return
 mod=o.modifiers.new('Silhouette reduction','DECIMATE'); mod.ratio=ratio
 mod.use_collapse_triangulate=True
 apply_modifier(o,mod)

def weighted(o):
 # Preserve designed hard edges and improve large flat plastic panels.
 mod=o.modifiers.new('Area weighted plastic normals','WEIGHTED_NORMAL')
 mod.keep_sharp=True; mod.weight=40
 apply_modifier(o,mod)


def load_original_with_web_art(id):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 original=ROOT/'source'/'original'/(ORIGINAL.get(id,id)+'.glb')
 source={}; source_indices={}
 if original.exists():
  bpy.ops.import_scene.gltf(filepath=str(static_file(original)))
  for o in list(bpy.context.scene.objects):
   if o.type=='MESH':
    source[o.name]=o.data.copy()
    source_indices[o.name]=[p.material_index for p in o.data.polygons]
  for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
  # Remove source materials to avoid suffixes on authoritative web material names.
  for mesh in source.values():mesh.materials.clear()
  for m in list(bpy.data.materials):bpy.data.materials.remove(m)
  for im in list(bpy.data.images):bpy.data.images.remove(im)
 bpy.ops.import_scene.gltf(filepath=str(static_file(ROOT/'source'/'web'/(id+'.glb'))))
 matches=[]
 for o in list(bpy.context.scene.objects):
  if o.type!='MESH':continue
  if o.name in source:
   mesh=source[o.name]
   a=np.array([v.co[:] for v in mesh.vertices]); b=np.array([v.co[:] for v in o.data.vertices])
   if a.shape!=b.shape or not np.allclose(a,b,atol=2e-5):
    raise RuntimeError('Source geometry correspondence failed: '+o.name)
   mats=list(o.data.materials)
   o.data=mesh
   for m in mats:o.data.materials.append(m)
   for poly,index in zip(o.data.polygons,source_indices[o.name]):
    if index>=len(mats):raise RuntimeError('Material slot mismatch: '+o.name)
    poly.material_index=index
   matches.append(o.name)
 return matches


def restore(id):
 matches=load_original_with_web_art(id)
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 before=bounds(obs)
 notes=[]
 if id=='gb-console':
  # The inserted cart is behind the shell, and the room animates its own cartridge.
  for name in ['Object_17','Object_40','Object_41','Object_42']:
   o=bpy.data.objects.get(name)
   if o:bpy.data.objects.remove(o,do_unlink=True)
  notes.append('Removed dimming screen overlay and preinserted hidden cartridge; retained the slot.')
  colors={'Base':'c4bebb','On_off':'c4bebb','Pink_Buttons':'842447','D-Pad':'303234','D_Pad_Normal':'303234','Start-Select_Button':'79747c','Front_Panel':'66636e','Power_Switch':'777777'}
  for m in bpy.data.materials:
   if m.name in colors: plastic(m,colors[m.name],.62 if m.name!='Front_Panel' else .34)
  ratios={'Object_6':1.0,'Object_7':.65,'Object_8':.4,'Object_9':.65,'Object_12':.6,'Object_13':.7}
  for o in list(bpy.context.scene.objects):
   if o.name in ratios:
    collapse(o,ratios[o.name])
    if o.name!='Object_6':weighted(o)
 elif id=='gba-console':
  for m in bpy.data.materials:
   if m.name in ['lambert6','lambert7']:
    plastic(m,'4e4785',.57)
   elif m.name=='lambert1':plastic(m,'aaa8ac',.65)
   elif m.name in ['lambert12','lambert13']:plastic(m,'4c4b52',.65)
   elif m.name in ['lambert9','typeBlinn']:plastic(m,'34305c',.65)
   elif m.name=='lambert5':plastic(m,'22222a',.35)
  # The source displays a 3:2 image on a 4:3 screen; correct the internal aperture only.
  for name in ['pCube16_blinn2_0','pCube21_lambert10_0']:
   o=bpy.data.objects.get(name)
   if o:
    inverse=o.matrix_world.inverted(); bb=bounds([o]); cz=bb['center'][2]
    for v in o.data.vertices:
     co=o.matrix_world@v.co; co.z=cz+(co.z-cz)*8/9; v.co=inverse@co
  for o in obs:
   if o.name.startswith('typeMesh') or o.name=='pCube24_Nintendo_0':
    collapse(o,.58)
  notes.append('Launch indigo/violet shell, grey controls, 3:2 display aperture without changing UVs; reduced geometric wordmark tessellation.')
 elif id=='ds-console':
  from atlas import snapshot, bake_ds
  high=snapshot(obs)
  # Source normal maps and legends remain; change only the plastic pigment.
  for m in bpy.data.materials:
   p=principled(m)
   if not p:continue
   if m.name in ['top.002','base.002','base.002_0']:
    plastic(m,None,.64)
   if 'screen' in m.name.lower():
    for key in ['Normal','Metallic','Roughness','Transmission Weight']:
     for l in list(p.inputs[key].links):m.node_tree.links.remove(l)
    p.inputs['Metallic'].default_value=0; p.inputs['Roughness'].default_value=.3
    p.inputs['Transmission Weight'].default_value=0
  for o in obs:
   if o.name in ['Object_8','Object_27']:collapse(o,.22)
   elif o.name not in ['Object_9','Object_28','Object_14','Object_15']:collapse(o,.5)
  low=[o for o in obs if o.name in ['Object_8','Object_13','Object_23','Object_27']]
  bake_ds(high,low)
  notes.append('Graphite shell atlas; high-to-low tangent normal bake retains source embossing, screws and vents; separate screen art.')
 elif id=='pc':
  for o in obs:
   if o.name!='Monitor_MonitorGlass_0':collapse(o,.78)
  for m in bpy.data.materials:
   if m.name=='Monitor':plastic(m,'c5c1b4',.68)
  notes.append('Warm beige ABS and reduced hidden/coplanar bevel tessellation; glass retained.')
 elif id=='crossfader-player':
  for o in obs:
   if o.name=='VolumeWheel':collapse(o,.5)
   elif o.name=='Body':collapse(o,.8)
  notes.append('Retained all artwork, Door and complete Cassette hierarchy for insertion and opening.')
 elif id=='gb-cart':
  for m in bpy.data.materials:
   if m.name in ['Cart','NormalMap']:plastic(m,'a7a4a5',.68)
  notes.append('Neutral grey DMG cartridge plastic; retained the authored tilt and label UVs.')
 elif id=='gba-cart':
  for m in bpy.data.materials:
   if m.name in ['Cartrough','cARTsmooth']:
    p=principled(m)
    for l in list(p.inputs['Metallic'].links):m.node_tree.links.remove(l)
    p.inputs['Metallic'].default_value=0
  # Nintendo specifies the outer Game Pak envelope as 60 x 34.5 mm.
  # Correct only the 1.8% excess height; the fixed room frame still fits.
  target_ratio=34.5/60
  factor=target_ratio*before['size'][1]/before['size'][2]
  for o in obs:
   inverse=o.matrix_world.inverted();cz=before['center'][2]
   for v in o.data.vertices:
    co=o.matrix_world@v.co;co.z=cz+(co.z-cz)*factor;v.co=inverse@co
  notes.append('Corrected height to the Nintendo 60 x 34.5 mm envelope within 2%; dielectric ABS; retained ribs, contacts, screw and Minamoto label.')
 elif id=='ds-cart':
  # Texture/material repair is performed before compression in finish.mjs.
  notes.append('Replaced baked unlit shading with matte ABS and metallic gold contacts; retained notch and Legends Arise label.')
 elif id=='crossfader-cassette':
  notes.append('Preserved Omar\'s original palette, geometric art, reels and LabelB nodes.')
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 after=bounds(obs)
 # Do not silently apply a global proportion correction: the room owns that frame.
 if any(abs(after['size'][i]/before['size'][i]-1)>.02 for i in range(3)):
  raise RuntimeError('Restoration exceeded reference box: '+str(after))
 # Remove unused UV channels and data; no normal recalculation across hard seams.
 for o in obs:
  while len(o.data.uv_layers)>1:o.data.uv_layers.remove(o.data.uv_layers[-1])
 select_only(list(bpy.context.scene.objects))
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'work'/(id+'-restored.glb')),export_format='GLB',
  use_selection=True,export_cameras=False,export_lights=False,export_extras=True,
  export_yup=True,export_image_format='AUTO',export_materials='EXPORT')
 log=dict(id=id,original_meshes_used=matches,bounds_before=before,bounds_restored=after,notes=notes)
 (ROOT/'work'/(id+'-restoration.json')).write_text(json.dumps(log,indent=2))
 print('RESTORED',id,json.dumps(log),flush=True)
if __name__=='__main__':restore(sys.argv[sys.argv.index('--')+1])
