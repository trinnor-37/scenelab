"""BingeNest popcorn tub eruption: fully 3D, path-traced with Blender Cycles
(the `bpy` module), driven entirely from Python.

Everything is real geometry:
  * the tub is a lathed mesh: a tapered cup with a scalloped rim, a rolled lip
    bead and real wall thickness, glossy coated paper and a UV-mapped
    stripe + logo label
  * every popcorn kernel is a real mesh: a metaball cluster with procedural
    cauliflower displacement, subsurface scattering, a cream-to-gold pointiness
    gradient and hull flecks. 8 variants, linked across ~560 instances.
  * a dense heap (plus a hidden core so it has no holes), a geyser stream,
    paper chips, embers, a neon ring, a glow at the mouth and a light inside
  * real camera depth of field and Cycles motion blur (180-degree shutter)

Usage:
  python3 src/tub3d.py --format 16x9 [--frames 60 61] [--samples 48] [--preview 0.5]
Writes 16-bit RGBA PNGs (transparent) to out/tub3d/raw_<fmt>/.
Then run src/tub3d_post.py to make the finished videos.
"""
import argparse
import math
import os
import sys

import numpy as np
import bpy
from mathutils import Matrix, Quaternion, Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
FPS = 60
NF = 132                       # 2.2 s
T_ARRIVE, T_CHARGE, T_ERUPT, T_EXIT = 0.50, 0.70, 0.95, 1.48
H, RT, RB = 1.0, 0.58, 0.42    # tub height, top radius, bottom radius (metres)
SCAL, SC_AMP = 14, 0.035
G = 9.8
CAM_POS = {"16x9": Vector((0.0, -5.2, 1.35)), "9x16": Vector((0.0, -5.6, 1.45))}
CAM_AIM = Vector((0.0, 0.0, 0.78))


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def out_quart(x):
    x = clamp(x)
    return 1 - (1 - x) ** 4


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def r_at(z):
    return RB + (RT - RB) * z / H


def rim_z(th):
    return H - SC_AMP * (0.5 - 0.5 * np.cos(SCAL * th))


# ====================================================================== motion
def tub_pose(t, fmt):
    """Tub base-centre location, rotation (Euler XYZ, radians) and scale."""
    p = clamp(t / T_ARRIVE)
    e = out_expo(p) * 0.8 + out_quart(p) * 0.2
    q = out_quart(p)
    side = -1.0 if fmt == "16x9" else 0.0
    x = side * 3.2 * (1 - q) + (1.0 if fmt == "16x9" else 0) * 0.9 * math.sin(math.pi * q)
    y = 42.0 * (1 - e)
    z = (1.6 if fmt == "16x9" else -2.4) * (1 - q) + 0.6 * math.sin(math.pi * q)
    yaw = -2.6 * 2 * math.pi * (1 - q)
    pitch = math.radians(-35) * (1 - q)
    roll = math.radians(28) * (1 - q) * math.sin(p * 6)
    u = t - T_ARRIVE
    if u > 0:
        roll += math.radians(4) * math.exp(-u * 7) * math.sin(u * 22)
        z += 0.03 * math.sin(u * 3.0)
        yaw += math.radians(10) * math.sin(smooth(u / 0.45) * math.pi) * 0.5
    c = smooth((t - T_CHARGE) / (T_ERUPT - T_CHARGE))
    k = c * (1 - smooth((t - T_ERUPT) / 0.35))
    if k > 0:
        x += k * 0.018 * math.sin(t * 157)
        z += k * 0.014 * math.sin(t * 131 + 1)
        roll += k * math.radians(2.5) * math.sin(t * 173)
    sq = 1 - 0.08 * smooth((t - (T_ERUPT - 0.10)) / 0.10) * (1 - smooth((t - T_ERUPT) / 0.08))
    if t > T_ERUPT:                                   # recoil
        u2 = t - T_ERUPT
        z -= 0.10 * math.exp(-u2 * 6) * math.sin(u2 * 18 + 0.3)
    ue = clamp((t - T_EXIT) / 0.42)
    if ue > 0:                                        # dive past the lens
        ein = ue ** 2.6
        sg = 1.0 if fmt == "16x9" else 0.6
        x += 2.6 * ein * sg
        y -= 3.0 * ein
        z -= 1.4 * ein
        yaw += math.radians(70) * ein
        roll -= math.radians(35) * ein
        pitch += math.radians(25) * ein
    return Vector((x, y, z)), Euler((pitch, roll, yaw), "XYZ"), Vector((1 / math.sqrt(sq), 1 / math.sqrt(sq), sq))


def tub_matrix(t, fmt):
    loc, rot, sc = tub_pose(t, fmt)
    return Matrix.LocRotScale(loc, rot, sc)


# ====================================================================== textures
def make_label(path):
    from PIL import Image
    import cv2
    TW, TH = 4096, 1150
    uu = np.arange(TW, dtype=np.float32)[None, :].repeat(TH, 0)
    n = 24
    f = (uu / TW * n) % 1.0
    k = np.floor(uu / TW * n) % 2
    edge = np.clip(np.minimum(f, 1 - f) * TW / n / 1.4, 0, 1)
    red = np.float32([0.80, 0.02, 0.05])
    white = np.float32([0.93, 0.90, 0.86])
    a = np.where((k == 0)[..., None], red, white)
    b = np.where((k == 0)[..., None], white, red)
    col = a * (0.5 + 0.5 * edge[..., None]) + b * (0.5 - 0.5 * edge[..., None])
    logo = np.array(Image.open(os.path.join(ROOT, "assets", "reference_logo.png")).convert("RGBA")).astype(np.float32) / 255
    ys, xs = np.where(logo[..., 3] > 0.02)
    logo = logo[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    lh = int(TH * 0.66)
    lw = int(logo.shape[1] * lh / logo.shape[0] * 0.92)
    L = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
    for cu in (0.75, 0.25):                          # front (faces -Y) and back
        x0 = int(cu * TW - lw / 2)
        y0 = int(TH * 0.20)
        reg = col[y0:y0 + lh, x0:x0 + lw]
        al = L[..., 3:4]
        reg[:] = L[..., :3] * al + reg * (1 - al)
    # v=0 at the bottom in Blender UVs: flip so the image's top is the rim
    Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(path)


# ====================================================================== geometry
def mesh_from_arrays(name, verts, faces, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uvs is not None:
        uvl = me.uv_layers.new(name="UVMap")
        lo = np.zeros(len(me.loops) * 2, np.float32)
        vi = np.zeros(len(me.loops), np.int32)
        me.loops.foreach_get("vertex_index", vi)
        lo[0::2] = uvs[vi, 0]
        lo[1::2] = uvs[vi, 1]
        uvl.data.foreach_set("uv", lo)
    me.update()
    me.shade_smooth()
    return me


def build_tub_mesh():
    NA, NV = 288, 48
    th = np.linspace(0, 2 * np.pi, NA + 1)
    verts, uvs, faces = [], [], []
    for j in range(NV + 1):
        f = j / NV
        for i in range(NA + 1):
            zt = rim_z(th[i])
            z = f * zt
            r = r_at(z)
            verts.append((math.cos(th[i]) * r, math.sin(th[i]) * r, z))
            uvs.append((th[i] / (2 * np.pi), f))
    W = NA + 1
    for j in range(NV):
        for i in range(NA):
            a = j * W + i
            faces.append((a, a + 1, a + 1 + W, a + W))
    # bottom cap
    c = len(verts)
    verts.append((0, 0, 0.0)); uvs.append((0.5, 0.0))
    for i in range(NA):
        faces.append((c, i + 1, i))
    return mesh_from_arrays("tub", np.array(verts), faces, np.array(uvs, np.float32))


def build_lip_mesh(rad=0.017):
    NA, NR = 576, 14
    th = np.linspace(0, 2 * np.pi, NA, endpoint=False)
    verts, faces = [], []
    for i in range(NA):
        z0 = rim_z(th[i])
        r0 = r_at(z0) - 0.004
        cdir = np.array([math.cos(th[i]), math.sin(th[i]), 0])
        for k in range(NR):
            a = 2 * np.pi * k / NR
            p = np.array([0, 0, z0]) + cdir * r0 + cdir * math.cos(a) * rad + np.array([0, 0, 1]) * math.sin(a) * rad
            verts.append(p)
    for i in range(NA):
        for k in range(NR):
            a = i * NR + k
            b = i * NR + (k + 1) % NR
            c = ((i + 1) % NA) * NR + (k + 1) % NR
            d = ((i + 1) % NA) * NR + k
            faces.append((a, b, c, d))
    return mesh_from_arrays("lip", np.array(verts), faces)


def build_torus(major=1.0, minor=0.014, NA=256, NR=12):
    """Ring in the XZ plane (faces the camera, which looks along +Y)."""
    verts, faces = [], []
    for i in range(NA):
        a = 2 * np.pi * i / NA
        c = np.array([math.cos(a) * major, 0, math.sin(a) * major])
        rd = np.array([math.cos(a), 0, math.sin(a)])
        for k in range(NR):
            b = 2 * np.pi * k / NR
            verts.append(c + rd * math.cos(b) * minor + np.array([0, 1, 0]) * math.sin(b) * minor)
    for i in range(NA):
        for k in range(NR):
            faces.append((i * NR + k, i * NR + (k + 1) % NR, ((i + 1) % NA) * NR + (k + 1) % NR, ((i + 1) % NA) * NR + k))
    return mesh_from_arrays("ring", np.array(verts), faces)


def sine_noise(P, rng, n=40, fmin=4, fmax=22):
    d = rng.normal(size=(n, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    fr = rng.uniform(fmin, fmax, n)
    ph = rng.uniform(0, 2 * np.pi, n)
    amp = 1 / fr
    v = np.zeros(len(P))
    for k in range(n):
        v += amp[k] * np.sin(P @ d[k] * fr[k] + ph[k])
    return v / amp.sum()


def build_kernel_mesh(seed):
    """Popped kernel: a 'butterfly' of distinct puffed lobes (metaballs, with a
    high threshold so they stay separate) plus crumpled, flaky displacement."""
    rng = np.random.default_rng(seed + 11)
    mb = bpy.data.metaballs.new(f"kmb{seed}")
    mb.resolution = 0.032
    mb.render_resolution = 0.032
    mb.threshold = 1.0
    ob = bpy.data.objects.new(f"kmb{seed}", mb)
    bpy.context.scene.collection.objects.link(ob)
    e = mb.elements.new(); e.co = (0, 0, 0); e.radius = 0.62; e.stiffness = 3.2
    nl = int(rng.integers(7, 12))
    dirs = rng.normal(size=(nl, 3))
    for j in range(nl):
        v = dirs[j] / np.linalg.norm(dirs[j])
        v[2] *= 0.8
        e = mb.elements.new()
        e.co = tuple(v * rng.uniform(0.36, 0.58))
        e.radius = rng.uniform(0.34, 0.56) * (0.75 if j > 6 else 1.0)
        e.stiffness = rng.uniform(2.4, 3.6)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bpy.data.metaballs.remove(mb)
    n = len(me.vertices)
    co = np.zeros(n * 3, np.float32); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    nr = np.zeros(n * 3, np.float32); me.vertices.foreach_get("normal", nr); nr = nr.reshape(-1, 3)
    # crumpled flakes: cellular (Voronoi F2-F1) ridges = the folded starch
    # sheets of a popped kernel, plus a lumpy layer
    sz = np.abs(co).max()
    pts = rng.uniform(-sz, sz, (260, 3)).astype(np.float32)
    d2 = ((co[:, None, :] - pts[None]) ** 2).sum(-1)
    part = np.partition(d2, 1, axis=1)
    f1, f2 = np.sqrt(part[:, 0]), np.sqrt(part[:, 1])
    cell = np.clip((f2 - f1) / (0.12 * sz), 0, 1)
    disp = (cell ** 0.6 - 0.5) * 0.09 * sz + sine_noise(co, rng, 30, 5, 12) * 0.10 * sz \
        + sine_noise(co, rng, 40, 20, 40) * 0.025 * sz
    co = co + nr * disp[:, None]
    crev = np.clip(1 - (disp - disp.min()) / (np.ptp(disp) + 1e-6), 0, 1) ** 1.5
    co -= co.mean(0)
    co /= np.abs(co).max()
    me.vertices.foreach_set("co", co.ravel() * 0.75)
    at = me.attributes.new("crev", "FLOAT", "POINT")
    at.data.foreach_set("value", crev.astype(np.float32))
    me.update()
    me.shade_smooth()
    me.name = f"kernel{seed}"
    return me


# ====================================================================== materials
def node_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(nt, **kw):
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    for k, v in kw.items():
        if k in b.inputs:
            b.inputs[k].default_value = v
    return b


def mat_popcorn():
    """Butter-gold in the crevices (ambient occlusion), creamy yellow on the
    puffs, translucent, a touch of buttery sheen, sparse brown hull flecks."""
    m, nt, out = node_mat("popcorn")
    ao = nt.nodes.new("ShaderNodeAttribute"); ao.attribute_name = "crev"
    inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
    nt.links.new(ao.outputs["Fac"], inv.inputs[1])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.55, 0.13, 0.0, 1)
    ramp.color_ramp.elements[1].position = 0.92
    ramp.color_ramp.elements[1].color = (1.0, 0.58, 0.06, 1)
    nt.links.new(inv.outputs["Value"], ramp.inputs["Fac"])
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.5
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    nr = nt.nodes.new("ShaderNodeMapRange")
    nr.inputs["From Min"].default_value = 0.35; nr.inputs["From Max"].default_value = 0.65
    nr.inputs["To Min"].default_value = 0.0; nr.inputs["To Max"].default_value = 1.0
    nt.links.new(noise.outputs["Fac"], nr.inputs["Value"])
    mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"
    nt.links.new(nr.outputs["Result"], mixc.inputs["Factor"])
    nt.links.new(ramp.outputs["Color"], mixc.inputs["A"])
    # creamier patches on the puffs
    cream = nt.nodes.new("ShaderNodeMix"); cream.data_type = "RGBA"; cream.blend_type = "MIX"
    cream.inputs["Factor"].default_value = 0.6
    nt.links.new(ramp.outputs["Color"], cream.inputs["A"])
    cream.inputs["B"].default_value = (1.0, 0.86, 0.48, 1)
    nt.links.new(cream.outputs["Result"], mixc.inputs["B"])
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 2.0
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    fr = nt.nodes.new("ShaderNodeMapRange")
    fr.inputs["From Min"].default_value = 0.06
    fr.inputs["From Max"].default_value = 0.0
    nt.links.new(vor.outputs["Distance"], fr.inputs["Value"])
    mixf = nt.nodes.new("ShaderNodeMix"); mixf.data_type = "RGBA"
    nt.links.new(fr.outputs["Result"], mixf.inputs["Factor"])
    nt.links.new(mixc.outputs["Result"], mixf.inputs["A"])
    mixf.inputs["B"].default_value = (0.38, 0.12, 0.02, 1)
    b = principled(nt, Roughness=0.55)
    b.inputs["Subsurface Weight"].default_value = 0.0
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.75, 0.3)
    b.inputs["Subsurface Scale"].default_value = 0.01
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.3
    nt.links.new(mixf.outputs["Result"], b.inputs["Base Color"])
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_tub(label_path):
    m, nt, out = node_mat("tub")
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(label_path)
    img.interpolation = "Cubic"
    b = principled(nt, Roughness=0.32)
    b.inputs["Coat Weight"].default_value = 0.7
    b.inputs["Coat Roughness"].default_value = 0.06
    nt.links.new(img.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_simple(name, color, rough=0.3, coat=0.5):
    m, nt, out = node_mat(name)
    b = principled(nt, Roughness=rough)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Coat Weight"].default_value = coat
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_emit(name, color, strength, see_through=False):
    m, nt, out = node_mat(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*color, 1)
    e.inputs["Strength"].default_value = strength
    if see_through:     # emission over a transparent body: invisible when off
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        ad = nt.nodes.new("ShaderNodeAddShader")
        nt.links.new(tr.outputs["BSDF"], ad.inputs[0])
        nt.links.new(e.outputs["Emission"], ad.inputs[1])
        nt.links.new(ad.outputs["Shader"], out.inputs["Surface"])
    else:
        nt.links.new(e.outputs["Emission"], out.inputs["Surface"])
    return m, e


def mat_glow_plane():
    """Radial-gradient emissive card (transparent outside) for the mouth blaze."""
    m, nt, out = node_mat("glow")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    grad = nt.nodes.new("ShaderNodeTexGradient"); grad.gradient_type = "SPHERICAL"
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.0, 1.0, 1.0)
    nt.links.new(tc.outputs["Object"], grad.inputs["Vector"])
    pw = nt.nodes.new("ShaderNodeMath"); pw.operation = "POWER"; pw.inputs[1].default_value = 2.2
    nt.links.new(grad.outputs["Fac"], pw.inputs[0])
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (1.0, 0.72, 0.38, 1)
    e.inputs["Strength"].default_value = 0.0
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mx = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(pw.outputs["Value"], mx.inputs["Fac"])
    nt.links.new(tr.outputs["BSDF"], mx.inputs[1])
    nt.links.new(e.outputs["Emission"], mx.inputs[2])
    nt.links.new(mx.outputs["Shader"], out.inputs["Surface"])
    return m, e


def mat_chip():
    m, nt, out = node_mat("chip")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 1.6
    wave.inputs["Distortion"].default_value = 0.0
    nt.links.new(tc.outputs["UV"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = (0.80, 0.02, 0.05, 1)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = (0.93, 0.90, 0.86, 1)
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    b = principled(nt, Roughness=0.35)
    b.inputs["Coat Weight"].default_value = 0.5
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


# ====================================================================== animation helpers
def channelbag_for(obj):
    from bpy_extras import anim_utils
    ad = obj.animation_data_create()
    act = bpy.data.actions.new(obj.name + "_act")
    ad.action = act
    slot = act.slots.new(id_type="OBJECT", name=obj.name)
    ad.action_slot = slot
    return anim_utils.action_ensure_channelbag_for_slot(act, slot)


def set_curves(obj, frames, loc=None, quat=None, scale=None):
    """Bake per-frame transforms as LINEAR f-curves (fast foreach_set)."""
    cb = channelbag_for(obj)
    fr = np.asarray(frames, np.float32)

    def put(path, idx, vals):
        fc = cb.fcurves.new(path, index=idx)
        fc.keyframe_points.add(len(fr))
        co = np.empty(len(fr) * 2, np.float32)
        co[0::2] = fr
        co[1::2] = vals
        fc.keyframe_points.foreach_set("co", co)
        fc.keyframe_points.foreach_set("interpolation", np.full(len(fr), 1, np.int32))  # LINEAR
        fc.update()
    if loc is not None:
        for i in range(3):
            put("location", i, loc[:, i])
    if quat is not None:
        obj.rotation_mode = "QUATERNION"
        for i in range(4):
            put("rotation_quaternion", i, quat[:, i])
    if scale is not None:
        for i in range(3):
            put("scale", i, scale[:, i])


def decompose_series(mats):
    locs, quats, scs = [], [], []
    prev = None
    for M in mats:
        l, q, s = M.decompose()
        if prev is not None and prev.dot(q) < 0:
            q = -q
        prev = q
        locs.append(tuple(l)); quats.append(tuple(q)); scs.append(tuple(s))
    return np.array(locs), np.array(quats), np.array(scs)


def key_value(socket_owner, path, pairs):
    for f, v in pairs:
        setattr(socket_owner, path, v) if not hasattr(socket_owner, "default_value") else None
        if hasattr(socket_owner, "default_value"):
            socket_owner.default_value = v
            socket_owner.keyframe_insert("default_value", frame=f)
        else:
            socket_owner.keyframe_insert(path, frame=f)


# ====================================================================== scene build
def build(fmt, samples, preview):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, NF
    W, Hh = (1920, 1080) if fmt == "16x9" else (1080, 1920)
    sc.render.resolution_x, sc.render.resolution_y = W, Hh
    sc.render.resolution_percentage = int(preview * 100)
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.05
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 6
    cy.diffuse_bounces = 2
    cy.glossy_bounces = 2
    cy.transmission_bounces = 2
    cy.transparent_max_bounces = 6
    cy.volume_bounces = 0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0
    sc.render.use_persistent_data = True
    sc.render.film_transparent = True
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "16"
    sc.view_settings.view_transform = os.environ.get("TUB_VIEW", "Standard")
    sc.view_settings.look = os.environ.get("TUB_LOOK", "Medium High Contrast") if sc.view_settings.view_transform == "Standard" else "AgX - Punchy"
    sc.view_settings.exposure = float(os.environ.get("TUB_EXPOSURE", "-0.35"))

    # world: dark purple ambience (invisible with film_transparent, still lights)
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.16, 0.08, 0.26, 1)
    bg.inputs["Strength"].default_value = 0.45

    col = sc.collection
    label = os.path.join(ROOT, "out", "tub3d", "label.png")
    os.makedirs(os.path.dirname(label), exist_ok=True)
    make_label(label)

    # ---- tub
    tub = bpy.data.objects.new("tub", build_tub_mesh()); col.objects.link(tub)
    tub.data.materials.append(mat_tub(label))
    so = tub.modifiers.new("solid", "SOLIDIFY"); so.thickness = 0.012; so.offset = -1
    lip = bpy.data.objects.new("lip", build_lip_mesh()); col.objects.link(lip)
    lip.data.materials.append(mat_simple("lipmat", (0.95, 0.92, 0.9), 0.25, 0.8))
    lip.parent = tub

    # inner light + mouth glow (children of the tub)
    ld = bpy.data.lights.new("inner", "POINT"); ld.color = (1.0, 0.72, 0.38); ld.shadow_soft_size = 0.25
    li = bpy.data.objects.new("inner", ld); col.objects.link(li); li.parent = tub; li.location = (0, 0, 0.92)
    gm, gemit = mat_glow_plane()
    gp_me = mesh_from_arrays("glowcard", np.array([[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]], float) * 1.0,
                             [(0, 1, 2, 3)])
    gp = bpy.data.objects.new("glow", gp_me); col.objects.link(gp); gp.data.materials.append(gm)
    gp.parent = tub; gp.location = (0, 0.15, 1.15); gp.scale = (0.85, 1, 0.75)
    gp.visible_shadow = False
    gp.visible_diffuse = False
    gp.visible_glossy = False

    # ---- lights
    def area(name, loc, energy, color, size, aim=(0, 0, 0.7)):
        d = bpy.data.lights.new(name, "AREA"); d.energy = energy; d.color = color; d.size = size
        o = bpy.data.objects.new(name, d); col.objects.link(o); o.location = loc
        o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o
    area("key", (-3.2, -4.0, 4.6), 1900, (1.0, 0.92, 0.82), 3.0)
    area("rimL", (-3.8, 3.2, 2.4), 1500, (0.75, 0.30, 1.0), 2.0)
    area("rimR", (3.8, 3.0, 2.0), 1500, (1.0, 0.30, 0.85), 2.0)
    area("fill", (2.5, -4.5, 0.0), 300, (0.6, 0.4, 1.0), 4.0)

    # ---- camera
    cd = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cd); col.objects.link(cam); sc.camera = cam
    if fmt == "16x9":
        cd.sensor_fit = "HORIZONTAL"; cd.sensor_width = 36; cd.lens = 35
    else:
        cd.sensor_fit = "VERTICAL"; cd.sensor_height = 24; cd.lens = 30
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 2.2
    cd.clip_start = 0.05
    cp = CAM_POS[fmt]

    # ---- popcorn meshes + material
    pm = mat_popcorn()
    kms = [build_kernel_mesh(s) for s in range(8)]
    for me in kms:
        me.materials.append(pm)
    rng = np.random.default_rng(7)
    frames = np.arange(0, NF + 2)
    T = frames / FPS
    TM = [tub_matrix(t, fmt) for t in T]
    ksc = 0.13

    def rand_quat():
        q = rng.normal(size=4)
        return Quaternion(q / np.linalg.norm(q))

    def axis_quat(axis, ang):
        return Quaternion(Vector(axis).normalized(), ang)

    # filler core: a bumpy gold dome under the heap so it never shows holes
    core_me = bpy.data.meshes.new("core")
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.0)
    bm.to_mesh(core_me); bm.free()
    co = np.zeros(len(core_me.vertices) * 3, np.float32); core_me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    co[:, 0] *= RT * 0.97; co[:, 1] *= RT * 0.97
    co[:, 2] = np.where(co[:, 2] > 0, co[:, 2] * 0.50, co[:, 2] * 0.25)
    co = co + co * sine_noise(co * 3, rng, 30, 3, 12)[:, None] * 0.12
    core_me.vertices.foreach_set("co", co.ravel()); core_me.update(); core_me.shade_smooth()
    core_me.materials.append(pm)
    core = bpy.data.objects.new("core", core_me); col.objects.link(core); core.parent = tub
    core.location = (0, 0, H - 0.04)
    # core sinks into the tub as the heap launches
    cb = channelbag_for(core)
    for i in range(3):
        fc = cb.fcurves.new("scale", index=i)
        kf = [(1, 1.0), (int(T_ERUPT * FPS), 1.0), (int((T_ERUPT + 0.25) * FPS), 0.55 if i < 2 else 0.05)]
        for f, v in kf:
            fc.keyframe_points.insert(f, v)
    fc = cb.fcurves.new("location", index=2)
    for f, v in [(1, H - 0.04), (int(T_ERUPT * FPS), H - 0.04), (int((T_ERUPT + 0.25) * FPS), H - 0.25)]:
        fc.keyframe_points.insert(f, v)

    kernels = []   # (local position, local quat, scale, launch t, velocity (tub-local), spin axis, spin rate)
    # heap: dense packed dome above the rim
    for i in range(420):
        rr = math.sqrt(rng.uniform(0, 1))
        a = rng.uniform(0, 2 * math.pi)
        rad = rr * RT * 1.0
        x, y = math.cos(a) * rad, math.sin(a) * rad
        z = H + 0.03 + 0.34 * (1 - rr ** 2.0) + rng.uniform(-0.03, 0.05)
        d = np.array([x * 1.6, y * 1.6, 1.0 + rng.uniform(0, 0.6)])
        d /= np.linalg.norm(d)
        v = d * rng.uniform(4.0, 7.5)
        kernels.append(dict(p=Vector((x, y, z)), q=rand_quat(), s=ksc * rng.uniform(0.85, 1.25),
                            ts=T_ERUPT + rng.uniform(0, 0.08) + (1 - rr) * 0.04, v=Vector(v),
                            ax=Vector(rng.normal(size=3)), w=rng.uniform(5, 16), lens=False))
    # geyser stream fed from inside the cup
    for i in range(330):
        a = rng.uniform(0, 2 * math.pi)
        z = rng.uniform(0.45, 0.85)
        rad = math.sqrt(rng.uniform(0, 1)) * (r_at(z) - 0.17)
        ts = T_ERUPT + 0.04 + (rng.uniform(0, 1) ** 1.5) * 0.55
        cone = rng.uniform(0.05, 0.75)
        ang = rng.uniform(0, 2 * math.pi)
        d = np.array([math.cos(ang) * math.sin(cone), math.sin(ang) * math.sin(cone), math.cos(cone)])
        v = d * rng.uniform(5.0, 9.0)
        lens = i % 3 == 0
        kernels.append(dict(p=Vector((math.cos(a) * rad, math.sin(a) * rad, z)), q=rand_quat(),
                            s=ksc * rng.uniform(0.85, 1.3), ts=ts, v=Vector(v),
                            ax=Vector(rng.normal(size=3)), w=rng.uniform(5, 18), lens=lens,
                            lv=Vector((rng.uniform(-1.6, 1.6), -rng.uniform(4.0, 7.0), rng.uniform(-0.5, 1.5)))))
    for n_, k in enumerate(kernels):
        o = bpy.data.objects.new(f"k{n_}", kms[n_ % 8]); col.objects.link(o)
        mats = []
        for fi, t in enumerate(T):
            if t < k["ts"]:
                M = TM[fi] @ Matrix.LocRotScale(k["p"], k["q"], Vector((k["s"],) * 3))
            else:
                u = t - k["ts"]
                fl = int(round(k["ts"] * FPS))
                M0 = tub_matrix(k["ts"], fmt)
                p0 = M0 @ k["p"]
                vw = M0.to_3x3().normalized() @ k["v"]
                if k["lens"]:
                    vw = vw * 0.55 + k["lv"]
                drag = 1.4
                dist = (1 - math.exp(-drag * u)) / drag
                p = p0 + vw * dist + Vector((0, 0, -0.5 * G * u * u))
                q0 = M0.to_quaternion() @ k["q"]
                q = axis_quat(k["ax"], k["w"] * u) @ q0
                s = k["s"]
                dcam = (p - cp).length
                if dcam < 0.9:
                    s *= smooth((dcam - 0.35) / 0.55)
                M = Matrix.LocRotScale(p, q, Vector((max(s, 1e-4),) * 3))
            mats.append(M)
        L, Q, S = decompose_series(mats)
        set_curves(o, frames, L, Q, S)

    # ---- tub keys
    L, Q, S = decompose_series(TM)
    set_curves(tub, frames, L, Q, S)

    # ---- inner light / glow keys
    def ramp_keys(t):
        c = smooth((t - T_CHARGE) / (T_ERUPT - T_CHARGE))
        u = t - T_ERUPT
        b = math.exp(-max(u, 0) * 4.5) * (u >= 0)
        lv = c * 0.35 + b * 1.4
        lv *= 1 - smooth((t - T_EXIT) / 0.3)
        return lv
    for f in range(0, NF + 2):
        lv = ramp_keys(f / FPS)
        ld.energy = 900 * lv
        ld.keyframe_insert("energy", frame=f)
        gemit.inputs["Strength"].default_value = 14 * lv
        gemit.inputs["Strength"].keyframe_insert("default_value", frame=f)

    # ---- neon ring behind the tub
    rm, remit = mat_emit("ringmat", (1.0, 0.18, 0.85), 0.0)
    ring = bpy.data.objects.new("ring", build_torus()); col.objects.link(ring)
    ring.data.materials.append(rm)
    ring.visible_shadow = False
    P_er = tub_matrix(T_ERUPT, fmt) @ Vector((0, 0, 0.75))
    for f in range(0, NF + 2):
        t = f / FPS
        u = t - T_ERUPT
        g = out_expo((u + 0.05) / 0.35) if u > -0.05 else 0.0
        s = 0.2 + 1.55 * g
        ring.location = (P_er.x, P_er.y + 0.9, P_er.z)
        ring.scale = (s, s, s)
        ring.keyframe_insert("location", frame=f)
        ring.keyframe_insert("scale", frame=f)
        fade = 1 - smooth((t - (T_EXIT + 0.1)) / 0.5)
        inten = ((0.9 + 2.0 * math.exp(-max(u, 0) * 6)) * fade) if u > -0.05 else 0.0
        remit.inputs["Strength"].default_value = 1.7 * inten
        remit.inputs["Strength"].keyframe_insert("default_value", frame=f)
        ring.hide_render = inten < 0.03
        ring.keyframe_insert("hide_render", frame=f)

    # ---- paper chips + embers
    cm = mat_chip()
    chip_me = mesh_from_arrays("chip", np.array([[-0.5, 0, -0.7], [0.5, 0, -0.5], [0.4, 0, 0.7], [-0.5, 0, 0.5]]),
                               [(0, 1, 2, 3)], np.array([[0, 0], [1, 0], [1, 1], [0, 1]], np.float32))
    chip_me.materials.append(cm)
    em, _ = mat_emit("ember", (1.0, 0.6, 0.25), 3.0)
    import bmesh as _bm
    emb_me = bpy.data.meshes.new("ember")
    bm = _bm.new(); _bm.ops.create_icosphere(bm, subdivisions=2, radius=1.0); bm.to_mesh(emb_me); bm.free()
    emb_me.materials.append(em)
    for kind, count, me, size in (("c", 80, chip_me, 0.055), ("e", 110, emb_me, 0.006)):
        for n_ in range(count):
            o = bpy.data.objects.new(f"{kind}{n_}", me); col.objects.link(o)
            if kind == "e":
                o.visible_shadow = False
            ts = T_ERUPT + rng.uniform(0, 0.55 if kind == "c" else 0.4)
            p0l = Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), H + rng.uniform(-0.05, 0.1)))
            a = rng.uniform(0, 2 * math.pi)
            sp = rng.uniform(3, 8) if kind == "c" else rng.uniform(4, 11)
            el = rng.uniform(0.35, 1.0)
            v = Vector((math.cos(a) * (1 - el) * 1.6, math.sin(a) * (1 - el) * 1.6 - rng.uniform(0, 1.0), el)) * sp
            ax = Vector(rng.normal(size=3)); w = rng.uniform(8, 25)
            q0 = rand_quat()
            s = size * rng.uniform(0.7, 1.4)
            mats = []
            for fi, t in enumerate(T):
                if t < ts:
                    M = Matrix.LocRotScale(Vector((0, 0, -50)), q0, Vector((1e-4,) * 3))
                else:
                    u = t - ts
                    M0 = tub_matrix(ts, fmt)
                    pw = M0 @ p0l
                    drag = 2.2 if kind == "c" else 1.2
                    dist = (1 - math.exp(-drag * u)) / drag
                    gg = 0.35 if kind == "c" else 0.6
                    p = pw + v * dist + Vector((0, 0, -0.5 * G * gg * u * u))
                    life = 1.0 if kind == "c" else (1 - smooth(u / 0.9))
                    q = axis_quat(ax, w * u) @ q0
                    M = Matrix.LocRotScale(p, q, Vector((max(s * life, 1e-4),) * 3))
                mats.append(M)
            L, Q, S = decompose_series(mats)
            set_curves(o, frames, L, Q, S)

    # ---- camera keys: subtle push + eruption shake
    for f in range(0, NF + 2):
        t = f / FPS
        push = 0.35 * smooth((t - 0.35) / 0.6)
        off = Vector((0, 0, 0))
        u = t - T_ERUPT
        if u >= 0:
            e = math.exp(-u * 8)
            off += Vector((0.025 * e * math.sin(u * 61), 0, 0.02 * e * math.sin(u * 53 + 1)))
            push += -0.25 * math.exp(-u * 7) * math.cos(u * 15) + 0.2 * (1 - math.exp(-u * 2.5))
        u = t - (T_EXIT + 0.3)
        if u >= 0:
            e = math.exp(-u * 9)
            off += Vector((0.02 * e * math.sin(u * 70), 0, 0.016 * e * math.sin(u * 59)))
        fwd = (CAM_AIM - cp).normalized()
        cam.location = cp + fwd * push + off
        cam.rotation_euler = (CAM_AIM - cp).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cd.dof.focus_distance = (tub_matrix(t, fmt) @ Vector((0, 0, 0.6)) - cam.location).length
        cd.dof.keyframe_insert("focus_distance", frame=f)
    return sc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9", choices=["16x9", "9x16"])
    ap.add_argument("--frames", nargs="*", type=int)
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--preview", type=float, default=1.0)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    sc = build(a.format, a.samples, a.preview)
    out = a.out or os.path.join(ROOT, "out", "tub3d", f"raw_{a.format}")
    os.makedirs(out, exist_ok=True)
    frames = a.frames if a.frames else list(range(1, NF + 1))
    import time
    for f in frames:
        t0 = time.time()
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, f"f{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[{a.format}] frame {f} {time.time() - t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
