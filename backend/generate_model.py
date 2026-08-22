import trimesh
import numpy as np

# Create an empty scene
scene = trimesh.Scene()

def add_box(name, extents, transform):
    mesh = trimesh.creation.box(extents=extents)
    mesh.apply_transform(transform)
    # Add to scene with the specific name
    scene.add_geometry(mesh, node_name=name, geom_name=name)

# Head
add_box("head", [0.4, 0.5, 0.4], trimesh.transformations.translation_matrix([0, 1.8, 0]))

# Neck
add_box("neck", [0.15, 0.2, 0.15], trimesh.transformations.translation_matrix([0, 1.45, 0]))

# Chest
add_box("chest", [0.8, 0.6, 0.4], trimesh.transformations.translation_matrix([0, 1.05, 0]))

# Lumbar
add_box("lumbar", [0.7, 0.5, 0.35], trimesh.transformations.translation_matrix([0, 0.5, 0]))

# Shoulders
add_box("left_shoulder", [0.3, 0.3, 0.3], trimesh.transformations.translation_matrix([-0.55, 1.2, 0]))
add_box("right_shoulder", [0.3, 0.3, 0.3], trimesh.transformations.translation_matrix([0.55, 1.2, 0]))

# Arms
add_box("left_arm", [0.25, 0.6, 0.25], trimesh.transformations.translation_matrix([-0.65, 0.75, 0]))
add_box("right_arm", [0.25, 0.6, 0.25], trimesh.transformations.translation_matrix([0.65, 0.75, 0]))

# Forearms
add_box("left_forearm", [0.2, 0.6, 0.2], trimesh.transformations.translation_matrix([-0.7, 0.15, 0]))
add_box("right_forearm", [0.2, 0.6, 0.2], trimesh.transformations.translation_matrix([0.7, 0.15, 0]))

# Hips
add_box("left_hip", [0.35, 0.3, 0.35], trimesh.transformations.translation_matrix([-0.2, 0.1, 0]))
add_box("right_hip", [0.35, 0.3, 0.35], trimesh.transformations.translation_matrix([0.2, 0.1, 0]))

# Thighs
add_box("left_thigh", [0.3, 0.7, 0.3], trimesh.transformations.translation_matrix([-0.25, -0.4, 0]))
add_box("right_thigh", [0.3, 0.7, 0.3], trimesh.transformations.translation_matrix([0.25, -0.4, 0]))

# Knees
add_box("left_knee", [0.25, 0.2, 0.25], trimesh.transformations.translation_matrix([-0.25, -0.85, 0]))
add_box("right_knee", [0.25, 0.2, 0.25], trimesh.transformations.translation_matrix([0.25, -0.85, 0]))

# Shins
add_box("left_shin", [0.25, 0.6, 0.25], trimesh.transformations.translation_matrix([-0.25, -1.25, 0]))
add_box("right_shin", [0.25, 0.6, 0.25], trimesh.transformations.translation_matrix([0.25, -1.25, 0]))

# Ankles/Feet
add_box("left_ankle", [0.25, 0.15, 0.4], trimesh.transformations.translation_matrix([-0.25, -1.625, 0.1]))
add_box("right_ankle", [0.25, 0.15, 0.4], trimesh.transformations.translation_matrix([0.25, -1.625, 0.1]))


# Export to GLB
scene.export("../frontend/public/model.glb")
print("Exported model.glb successfully!")
