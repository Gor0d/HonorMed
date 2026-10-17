"""Build an allowlisted, credential-free context archive for HonorMed assistants.

Run from any directory: python docs/ia/package-context.py
"""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[2]
paths = [
    "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md",
    "docs/IA.md", "docs/PLANO.md", "docs/ROADMAP.md", "docs/REGRAS.md",
    "docs/LANCAMENTO.md", "docs/VALIDACAO.md",
    "docs/FASE-4-REGISTRO-PESSOAL.md", "docs/brand/README.md",
    "web/AGENTS.md", "web/src/lib/brand.ts", "web/src/lib/plans.ts",
]
paths += [p.relative_to(root).as_posix() for p in sorted((root / ".agents/skills").glob("*/SKILL.md"))]
payload = [(name, (root / name).read_bytes()) for name in paths]
manifest = "\n".join(f"{sha256(data).hexdigest()}  {name}" for name, data in payload) + "\n"
target = root / "docs/ia/HonorMed_IA.zip"
with ZipFile(target, "w", ZIP_DEFLATED) as archive:
    for name, data in payload:
        archive.writestr(name, data)
    archive.writestr("MANIFEST.sha256", manifest)
with ZipFile(target) as archive:
    if archive.testzip() is not None:
        raise RuntimeError("Archive integrity check failed")
    if sorted(archive.namelist()) != sorted(paths + ["MANIFEST.sha256"]):
        raise RuntimeError("Unexpected file in context archive")
print(f"Created {target.name}: {len(paths)} context files, allowlist and ZIP integrity verified.")
