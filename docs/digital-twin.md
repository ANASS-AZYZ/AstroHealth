# Astronaut Digital Twin

The Digital Twin represents fictional astronaut Alex Morgan and reads the same mission state used by the Mars Mission Simulator. It does not create an independent telemetry stream.

The visualization loads the project-owned `frontend/public/models/astronaut.glb` asset with React Three Fiber, Three.js, and Drei. It supports 360-degree drag rotation, mouse-wheel zoom, camera reset, loading/error states, and clickable 3D indicator markers. Markers are attached to the model scene for visual synchronization, but they are interface aids and do not claim that each value is measured at that body location. A clear WebGL error state remains available when the browser cannot create a rendering context.

The model metadata identifies **Astronaut by Jungle Jim**, by [Jungle Jim](https://sketchfab.com/jungle_jim), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Sketchfab model page](https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845).

All measurements, status levels, alerts, and scenario effects are simulated and experimental. They are not clinical readings, diagnoses, treatment recommendations, or NASA-approved thresholds.
