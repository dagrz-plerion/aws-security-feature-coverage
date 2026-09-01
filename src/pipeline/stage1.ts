import { buildRegionUniverse } from "../universes/regions.js";
import { buildServiceUniverse } from "../universes/services.js";
import { buildResourceTypeUniverse } from "../universes/resourceTypes.js";
import { buildDataSourceUniverse } from "../universes/dataSources.js";
import type { Stage, StageResult } from "../core/runner.js";

export const stage1: Stage = {
  id: "stage1-universes",
  title: "Build the definitive lists everything else is measured against",
  async run(ctx): Promise<StageResult> {
    const notes: string[] = [];

    const regions = await buildRegionUniverse(ctx.maxAgeMs);
    notes.push(...regions.notes, ...regions.disagreements);
    ctx.log(`  regions ${regions.regions.length}, partitions ${regions.partitions.length}`);

    const services = await buildServiceUniverse(ctx.maxAgeMs);
    ctx.log(`  services ${services.services.length}, actions ${services.actions.length}, guides ${services.guides.length}`);

    const resourceTypes = await buildResourceTypeUniverse(
      services.serviceReferenceDocs,
      new Set(services.services.map((s) => s.id)),
    );
    notes.push(...resourceTypes.notes);
    ctx.log(`  resource types ${resourceTypes.resourceTypes.length}`);

    const dataSources = await buildDataSourceUniverse();
    ctx.log(`  data sources ${dataSources.length}`);

    return {
      status: notes.length > 0 ? "partial" : "ok",
      counts: {
        regions: regions.regions.length,
        partitions: regions.partitions.length,
        services: services.services.length,
        iamPrefixedServices: services.services.filter((s) => !s.id.includes(":")).length,
        actions: services.actions.length,
        docGuides: services.guides.length,
        products: services.products.length,
        resourceTypes: resourceTypes.resourceTypes.length,
        dataSources: dataSources.length,
      },
      ...(notes.length ? { notes: notes.slice(0, 40) } : {}),
    };
  },
};
