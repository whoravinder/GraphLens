from app.services.graph.neo4j_client import get_driver
import asyncio

async def test():
    driver = get_driver()
    async with driver.session() as s:
        res = await s.run('MATCH path=(n)-[r]-(m) RETURN n, r, m LIMIT 1')
        recs = await res.records()
        for r in recs:
            print(r['n'].labels)
            print(r['n'].element_id)
            print(r['r'].type)

asyncio.run(test())
