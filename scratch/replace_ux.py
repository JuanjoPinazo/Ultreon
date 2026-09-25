import os
import glob

app_dir = "/Users/juanjopinazo/Dev/Ultreon3/Ultreon/app/registry/new/components/"

def update_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")

for file in glob.glob(app_dir + "*.tsx"):
    update_file(file, "ClinicalScale7", "ClinicalScale")
