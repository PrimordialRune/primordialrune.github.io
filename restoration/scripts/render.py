"""Matched EEVEE evidence renders. Run: blender -b -P render.py -- ID GLB SUFFIX."""
import bpy, sys, json
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from glb_utils import static_file

ROOT=Path(__file__).resolve().parents[1]
VIEWS={
 'gb-console': (2.5,-1.0,1.1), 'gba-console': (0.75,-2.5,1.15),
 'ds-console': (0.85,-1.6,1.5), 'pc': (1.1,-2.5,1.25),
 'gb-cart': (2.5,-0.85,1.2), 'gba-cart': (2.5,0.9,1.1),
 'ds-cart': (0.8,-1.1,2.5), 'crossfader-player': (0.9,-2.5,1.25),
 'crossfader-cassette': (0.8,-2.5,1.25)}
def aim(obj, at): obj.rotation_euler=(Vector(at)-obj.location).to_track_quat('-Z','Y').to_euler()
def render(id,path,suffix):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(static_file(path)))
 scene=bpy.context.scene
 # The room shows A or B by toggling the co-located authored letter nodes.
 # Apply the same initial visibility to both evidence files, without editing either GLB.
 if id=='crossfader-cassette':
  hidden='LabelA' if suffix.endswith('side_b') else 'LabelB'
  for o in scene.objects:
   if o.name.startswith(hidden):o.hide_render=True
 obs=list(scene.objects)
 # Always use reference web framing, never auto-fit each output independently.
 ref=json.loads((ROOT/'work'/'inventory.json').read_text())['web/'+id]['bounds']
 scale=1/max(ref['size']); center=Vector(ref['center'])
 for o in obs:
  if not o.parent:
   o.location=(o.location-center)*scale
   o.scale*=scale
 bpy.context.view_layer.update()

 scene.render.engine='BLENDER_EEVEE'
 scene.eevee.taa_render_samples=64
 scene.render.resolution_x=1200; scene.render.resolution_y=900; scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG'
 scene.render.film_transparent=False
 scene.world=bpy.data.worlds.new('Neutral studio')
 scene.world.use_nodes=True
 scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.22,0.22,0.22,1)
 scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0.65
 scene.view_settings.view_transform='Standard'
 scene.view_settings.look='None'
 scene.view_settings.exposure=0; scene.view_settings.gamma=1
 direction=Vector(VIEWS[id])
 if suffix.endswith('back'): direction=Vector((-direction.x,-direction.y,direction.z))
 camera=bpy.data.objects.new('Evidence camera',bpy.data.cameras.new('Evidence camera'))
 scene.collection.objects.link(camera); scene.camera=camera
 camera.location=direction.normalized()*3; aim(camera,(0,0,0))
 camera.data.type='ORTHO'; camera.data.ortho_scale=1.75 if id=='ds-console' else 1.9 if id=='ds-cart' else 2.1 if id=='pc' else 1.55; camera.data.lens=50
 # GB/cassette front is in a vertical plane; preserve a conventional upward image.
 for name,loc,energy,size in [('Key', (1.5,-2.8,3.5),180,3),('Fill',(-3,-1,1.5),90,3),('Rim',(1,3,2.5),160,2.5)]:
  light=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA')); scene.collection.objects.link(light)
  light.location=loc; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size; aim(light,(0,0,0))
 scene.render.filepath=str(ROOT/'renders'/f'{id}_{suffix}.png')
 bpy.ops.render.render(write_still=True)
if __name__=='__main__':
 args=sys.argv[sys.argv.index('--')+1:]
 render(args[0],Path(args[1]).resolve(),args[2])

