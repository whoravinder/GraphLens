#!/usr/bin/env bash
set -euo pipefail

echo "Seeding knowledge base from public threat intel sources..."

docker compose exec -T backend python -c "
import asyncio
from app.services.ingestion.cisa import ingest_cisa_kev, ingest_mitre_attack
from app.services.ingestion.nvd import ingest_nvd_cves

async def seed():
    print('Ingesting CISA KEV...')
    n = await ingest_cisa_kev()
    print(f'CISA KEV: {n} documents')

    print('Ingesting MITRE ATT&CK...')
    n = await ingest_mitre_attack()
    print(f'MITRE ATT&CK: {n} documents')

    print('Ingesting NVD CVEs (network)...')
    n = await ingest_nvd_cves('network', 50)
    print(f'NVD CVEs: {n} documents')

asyncio.run(seed())
print('Seeding complete.')
"

echo "Done. Knowledge base is ready."
