import os
import re

TARGET_DIRS = ['/Users/juanjopinazo/Dev/Ultreon3/Ultreon/app']

REPLACEMENTS = [
    # text colors
    (r'\btext-slate-500\b', 'text-muted-foreground'),
    (r'\btext-slate-400\b', 'text-muted-foreground'),
    (r'\btext-slate-600\b', 'text-muted-foreground'),
    (r'\btext-gray-500\b', 'text-muted-foreground'),
    (r'\btext-gray-400\b', 'text-muted-foreground'),
    
    # bg colors
    (r'\bbg-white\b', 'bg-surface'),
    (r'\bbg-slate-50\b', 'bg-surface-secondary'),
    (r'\bbg-gray-50\b', 'bg-surface-secondary'),
    
    # borders
    (r'\bborder-slate-200\b', 'border-border'),
    (r'\bborder-slate-300\b', 'border-input-border'),
    (r'\bborder-gray-200\b', 'border-border'),
    
    # primary
    (r'\btext-cyan-500\b', 'text-primary'),
    (r'\btext-cyan-600\b', 'text-primary'),
    (r'\btext-cyan-700\b', 'text-primary'),
    (r'\bbg-cyan-50\b', 'bg-primary-soft'),
    (r'\bbg-cyan-100\b', 'bg-primary-soft'),
    (r'\bbg-cyan-500\b', 'bg-primary'),
    (r'\bbg-cyan-600\b', 'bg-primary'),
    (r'\bborder-cyan-500\b', 'border-primary'),
    
    # specific text replacements
    (r'Landing zone', 'Zona de aterrizaje'),
    (r'CO REGISTRATION IMPACT', 'Impacto del co-registro')
]

for root, _, files in os.walk(TARGET_DIRS[0]):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in REPLACEMENTS:
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
