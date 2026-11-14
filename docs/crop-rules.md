# Crop rules

Generated from `packages/core/src/rotation/crops.ts` by `scripts/crop-rules-doc.mjs`. Do not edit by hand.

Rule: no invented numbers. Every value comes from the source in brackets; "— (gap)" means no reliable source was found
and the value is left out (see `docs/limitations.md`). Notes marked "proxy" borrow a closely related FAO-56 row.
Kc ranges are used as a low/high band for water need; the midpoint is the central estimate.

| Crop | Family | Sowing (Hyderabad / South Sindh) | Harvest or season | FAO-56 stages (ini/dev/mid/late, days) | Kc ini / mid / end | Root depth | Depletion p | Salt threshold ECe, rating | N-fixing | Forage use |
|---|---|---|---|---|---|---|---|---|---|---|
| Cotton | Malvaceae [feedipedia_cotton] | 05-01 to 05-31 [sindh_sowing] (Hyderabad district: May) | 09-15 to 10-31 [sindh_sowing] (Thatta, Tharparkar, Hyderabad) | 30/50/60/55 [fao56_t11] (Mar-May planting; Egypt, Pakistan, California) | 0.35 / 1.15–1.2 / 0.5–0.7 [fao56_t12] | 1–1.7 m [fao56_t22] | 0.65 [fao56_t22] | 7.7 dS/m, T [fao56_t23] | no [feedipedia_cotton] (Malvaceae, not a legume) | none [feedipedia_cotton] (cottonseed meal is a feed by-product, not forage) |
| Wheat | Poaceae [feedipedia_wheat] | 11-01 to 11-20 [sindh_sowing] (Hyderabad district; early varieties) | 03-01 to 03-31 [sindh_sowing] (South Sindh: full month of March) | 25/35/65/40 [fao56_t11] (small grains, Oct/Nov planting, Pakistan; arid region) | 0.3 / 1.15 / 0.25–0.4 [fao56_t12] (spring wheat; Kc ini from cereals group) | 1–1.5 m [fao56_t22] (spring wheat) | 0.55 [fao56_t22] (spring wheat) | 6 dS/m, MT [fao56_t23] (Triticum aestivum) | no [feedipedia_wheat] (Poaceae, not a legume) | — (gap) |
| Rice | Poaceae [feedipedia_rice_straw] | 04-15 to 05-15 [sindh_sowing] (Hyderabad district (nursery)) | 09-01 to 10-31 [sindh_sowing] (South Sindh: September to October) | 30/30/60/30 [fao56_t11] (Tropics; Mediterranean) | 1.05 / 1.2 / 0.6–0.9 [fao56_t12] | 0.5–1 m [fao56_t22] | — (flooded crop / gap) | 3 dS/m, S [fao56_t23] | no [feedipedia_rice_straw] (Poaceae, not a legume) | residue [feedipedia_rice_straw] (rice straw is fed to livestock) |
| Sugarcane | Poaceae [feedipedia_sugarcane] | 02-10 to 03-30 [sindh_sowing] (spring planting (autumn planting Sep-Oct)) | 12-01 to 02-28 [sindh_sowing] (December to February) | 35/60/190/120 [fao56_t11] (virgin crop, low latitudes (405 days)) | 0.4 / 1.25 / 0.75 [fao56_t12] | 1.2–2 m [fao56_t22] | 0.65 [fao56_t22] | 1.7 dS/m, MS [fao56_t23] | no [feedipedia_sugarcane] (Poaceae, not a legume) | residue [feedipedia_sugarcane] (whole plant and tops used as forage) |
| Berseem (Egyptian clover) | Fabaceae [feedipedia_berseem] | 10-01 to 10-31 [feedipedia_berseem] ("usually sown in early autumn", read as October for Sindh; check locally) | 195 days [feedipedia_berseem] (first cut 50-60 days after sowing, then every 30-40 days, 5-6 cuts under irrigation: 55 + 4 x 35 = 195 days to the 5th cut) | 10/20/155/10 [fao56_t11] (proxy: initial/development/late from Alfalfa 1st cutting cycle (no berseem row in Table 11)) | 0.4 / 0.9 / 0.85 [fao56_t12] (berseem, averaged cutting effects) | 0.6–0.9 m [fao56_t22] | 0.5 [fao56_t22] (clover hay, berseem) | 1.5 dS/m, MS [fao56_t23] (Feedipedia calls it moderately tolerant; FAO-56 rates it MS) | yes [feedipedia_berseem] ("Berseem is an N-fixing legume") | fodder [feedipedia_berseem] (high-quality green fodder, cut and carried) |
| Mung bean | Fabaceae [feedipedia_mung] | 06-01 to 07-31 [dawn_mung_2007] (kharif crop "sown during the months of June and July") | 75 days [dawn_mung_2007] (varieties mature in 75-77 days) | 20/30/30/20 [fao56_t11] (green gram and cowpeas (Mediterranean)) | 0.4 / 1.05 / 0.35–0.6 [fao56_t12] (green gram; Kc ini from legumes group) | 0.6–1 m [fao56_t22] (green gram and cowpeas) | 0.45 [fao56_t22] (green gram and cowpeas) | — (gap) | yes [feedipedia_mung] ("a N-fixing legume") | residue [feedipedia_mung_straw] (mung bean straw is used as feed) |
| Sorghum (fodder) | Poaceae [feedipedia_sorghum] | 05-01 to 06-30 [fao56_t11] (sorghum, May/June planting; USA, Pakistan, Mediterranean) | 80 days [feedipedia_sorghum] (in Pakistan, sorghum hay harvested 80 days after sowing) | 20/35/40/30 [fao56_t11] (sorghum (scaled to the 80-day fodder season)) | 0.3 / 1–1.1 / 0.55 [fao56_t12] (sorghum grain; Kc ini from cereals group) | 1–2 m [fao56_t22] | 0.55 [fao56_t22] (sorghum grain) | 6.8 dS/m, MT [fao56_t23] | no [feedipedia_sorghum] (Poaceae, not a legume) | fodder [feedipedia_sorghum] |
| Sunflower | Asteraceae [feedipedia_sunflower] | 02-01 to 02-28 [sindh_sowing] (spring crop: whole month of February (autumn crop: August)) | 130 days [fao56_t11] (Table 11 total length (Mediterranean; California)) | 25/35/45/25 [fao56_t11] | 0.35 / 1–1.15 / 0.35 [fao56_t12] (Kc ini from oil crops group) | 0.8–1.5 m [fao56_t22] | 0.45 [fao56_t22] | — dS/m, MS [fao56_t23] (no threshold value given) | no [feedipedia_sunflower] (Asteraceae, not a legume) | residue [feedipedia_sunflower_residue] |
| Chickpea (gram) | Fabaceae [feedipedia_chickpea] | 10-15 to 11-30 [sindh_sowing] (gram) | 03-15 to 04-15 [sindh_sowing] (gram) | 25/35/70/40 [fao56_t11] (proxy: lentil, Oct/Nov planting, arid region (no chickpea row in Table 11)) | 0.4 / 1 / 0.35 [fao56_t12] (chick pea; Kc ini from legumes group) | 0.6–1 m [fao56_t22] | 0.5 [fao56_t22] | — (gap) | yes [feedipedia_chickpea] ("N-fixing legume (up to 100 kg N/ha)") | residue [feedipedia_chickpea_straw] |

## Sources

- **dawn_mung_2007**: Dawn, 16 Apr 2007: "Mungbean: a rich source of protein" (newspaper; check locally). https://www.dawn.com/news/242480/mungbean-a-rich-source-of-protein
- **fao56_t11**: FAO-56 (Allen et al. 1998), Table 11: lengths of crop development stages. https://www.fao.org/4/x0490e/x0490e0b.htm
- **fao56_t12**: FAO-56 (Allen et al. 1998), Table 12: single crop coefficients Kc. https://www.fao.org/4/x0490e/x0490e0b.htm
- **fao56_t22**: FAO-56 (Allen et al. 1998), Table 22: maximum effective rooting depth and depletion fraction p. https://www.fao.org/4/x0490e/x0490e0e.htm
- **fao56_t23**: FAO-56 (Allen et al. 1998), Table 23: salt tolerance (from FAO-29, Ayers & Westcot). https://www.fao.org/4/x0490e/x0490e0e.htm
- **feedipedia_berseem**: Heuzé et al. 2016. Berseem (Trifolium alexandrinum). Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/248
- **feedipedia_chickpea**: Heuzé et al. 2015. Chickpea (Cicer arietinum). Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/319
- **feedipedia_chickpea_straw**: Feedipedia: Chickpea straw. https://www.feedipedia.org/node/11976
- **feedipedia_cotton**: Heuzé et al. 2019. Cottonseed meal. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/550
- **feedipedia_mung**: Heuzé et al. 2015. Mung bean (Vigna radiata). Feedipedia (INRAE, CIRAD, AFZ, FAO). https://feedipedia.org/node/235
- **feedipedia_mung_straw**: Feedipedia: Mung bean (Vigna radiata), straw. https://www.feedipedia.org/node/12352
- **feedipedia_rice_straw**: Heuzé & Tran 2015. Rice straw. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/557
- **feedipedia_sorghum**: Heuzé et al. 2015. Sorghum forage. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/379
- **feedipedia_sugarcane**: Heuzé et al. 2018. Sugarcane forage, whole plant. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/14462
- **feedipedia_sunflower**: Heuzé et al. 2015. Sunflower seeds. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://www.feedipedia.org/node/40
- **feedipedia_sunflower_residue**: Feedipedia: Sunflower forage and crop residues. https://www.feedipedia.org/node/143
- **feedipedia_wheat**: Heuzé et al. 2015. Wheat grain. Feedipedia (INRAE, CIRAD, AFZ, FAO). https://feedipedia.org/node/223
- **sindh_sowing**: Sindh Agriculture, Supply & Prices Department: district-wise sowing periods and sowing dates. https://agri.sindh.gov.pk/showing-period
