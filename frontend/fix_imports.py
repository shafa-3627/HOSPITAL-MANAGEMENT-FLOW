import os
import re

src_dir = r"d:\yodha\frontend\src"

ui_components = [
    "Button", "Card", "Badge", "Dialog", "Input", "Select", "Tabs", "Table",
    "Tooltip", "Switch", "Avatar", "DropdownMenu", "Sheet", "ScrollArea",
    "Separator", "Skeleton", "Alert", "Progress", "Label", "Textarea",
    "Checkbox", "RadioGroup"
]

fixed = []

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".tsx") or f.endswith(".ts"):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as file:
                content = file.read()
            
            orig = content
            for comp in ui_components:
                # Replace lowercase /components/ui/button with Button etc.
                pattern = r'(@/components/ui/)' + comp.lower() + r'([\"\';\s])'
                content = re.sub(pattern, r'\g<1>' + comp + r'\g<2>', content)
            
            # Replace LoadingState text= with message=
            content = re.sub(r'(<LoadingState\s+[^>]*?)text=', r'\1message=', content)
            # Replace ErrorState error= with message=
            content = re.sub(r'(<ErrorState\s+[^>]*?)error=', r'\1message=', content)
            
            if content != orig:
                with open(p, "w", encoding="utf-8") as file:
                    file.write(content)
                fixed.append(f)

print(f"Processed files, modified {len(fixed)}: {fixed}")
