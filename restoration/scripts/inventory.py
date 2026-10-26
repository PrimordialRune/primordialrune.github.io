"""Run with Blender; inspect original and web assets without changing them."""
import bpy, json, sys
sys.path.insert(0,str(__import__("pathlib").Path(__file__).resolve().parent))
from glb_utils import static_file
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def bounds(objects):
    pts = [o.matrix_world @ v.co for o in objects if o.type == 'MESH' for v in o.data.vertices]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    return dict(min=lo, max=hi, size=[hi[i]-lo[i] for i in range(3)], center=[(hi[i]+lo[i])/2 for i in range(3)])
def inspect(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(static_file(path)))
    objects = list(bpy.context.scene.objects)
    result = {'bounds': bounds(objects), 'objects': [], 'materials': [], 'images': []}
    for o in objects:
        if o.type != 'MESH': continue
        o.data.calc_loop_triangles()
        result['objects'].append(dict(name=o.name, tris=len(o.data.loop_triangles), vertices=len(o.data.vertices),
            materials=[m.name if m else '' for m in o.data.materials], bounds=bounds([o]),
            matrix=[list(row) for row in o.matrix_world]))
    for m in bpy.data.materials:
        p = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m.use_nodes else None
        result['materials'].append(dict(name=m.name, color=list(p.inputs['Base Color'].default_value) if p else list(m.diffuse_color),
            roughness=p.inputs['Roughness'].default_value if p else m.roughness,
            textures=[n.image.name for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image] if m.use_nodes else []))
    for im in bpy.data.images:
        if im.name in ['Render Result', 'Viewer Node']: continue
        result['images'].append(dict(name=im.name, size=list(im.size)))
    result['tris'] = sum(o['tris'] for o in result['objects'])
    return result
if __name__ == '__main__':
    output = {}
    for folder in ['original','web']:
        for path in sorted((ROOT/'source'/folder).glob('*.glb')):
            print('INSPECT', folder, path.stem, flush=True)
            output[f'{folder}/{path.stem}'] = inspect(path)
    (ROOT/'work'/'inventory.json').write_text(json.dumps(output, indent=2))
