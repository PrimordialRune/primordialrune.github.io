"""Bake the source DS surface onto the simplified shell; keep screen UVs/materials separate."""
import bpy, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def select(objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
def join(objects,name):
 select(objects);bpy.ops.object.join();o=bpy.context.object;o.name=name
 return o

def snapshot(objects):
 copies=[]
 for o in objects:
  if o.name not in ['Object_8','Object_13','Object_23','Object_27']:continue
  c=o.copy();c.data=o.data.copy();bpy.context.scene.collection.objects.link(c)
  matrix=o.matrix_world.copy();c.parent=None;c.matrix_world=matrix
  c.name='BakeSource_'+o.name;copies.append(c)
 return copies

def bake_ds(high,low):
 scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.samples=1;scene.cycles.device='CPU'
 # A single source and target keeps ray casting consistent around the hinge.
 hi=join(high,'BakeSource');lo=join(low,'Graphite_shell_and_controls')
 select([lo]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
 bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.008,area_weight=.5)
 bpy.ops.object.mode_set(mode='OBJECT')
 atlas=bpy.data.images.new('DS_graphite_atlas',width=1024,height=1024,alpha=False)
 normal=bpy.data.images.new('DS_source_detail_normal',width=512,height=512,alpha=False)
 normal.colorspace_settings.name='Non-Color'
 # Temporarily add the image to every source material copied onto the low mesh.
 # Cycles needs an active target image on every low-poly material slot.
 for m in set(lo.data.materials):
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.name='BakeTarget';n.image=atlas
  m.node_tree.nodes.active=n
 select([lo,hi]);bpy.context.view_layer.objects.active=lo
 scene.render.bake.use_selected_to_active=True
 scene.render.bake.use_cage=False;scene.render.bake.cage_extrusion=.0003
 scene.render.bake.max_ray_distance=.0015;scene.render.bake.margin=8
 scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
 bpy.ops.object.bake(type='DIFFUSE')
 # Tangent normals transfer high-poly bevels, source embossed logos and vents.
 for m in set(lo.data.materials):
  n=m.node_tree.nodes['BakeTarget'];n.image=normal;m.node_tree.nodes.active=n
 bpy.ops.object.bake(type='NORMAL')
 for im in [atlas,normal]:
  im.filepath_raw=str(ROOT/'work'/(im.name+'.png'));im.file_format='PNG';im.save()
 m=bpy.data.materials.new('Graphite_plastic_atlas');m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.64
 p.inputs['Specular IOR Level'].default_value=.35
 a=m.node_tree.nodes.new('ShaderNodeTexImage');a.image=atlas
 m.node_tree.links.new(a.outputs['Color'],p.inputs['Base Color'])
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=normal
 nm=m.node_tree.nodes.new('ShaderNodeNormalMap');m.node_tree.links.new(n.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
 lo.data.materials.clear();lo.data.materials.append(m)
 for f in lo.data.polygons:f.material_index=0
 bpy.data.objects.remove(hi,do_unlink=True)
 return lo
