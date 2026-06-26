// RUTA: src/game/data/Zone1Data.ts
export const getZone1Data = (baseY: number) => {
  return {
    groundSegments: [
      { x: 0,    width: 600, yOffset: 0,   texture: "ground" }, 
      { x: 800,  width: 400, yOffset: -60, texture: "ground" }, 
      { x: 1500, width: 600, yOffset: 80,  texture: "ground" }, 
      { x: 2100, width: 800, yOffset: -180, texture: "ground" } 
    ],
    platformsData: [
      { x: 2000, y: baseY - 40, width: 140, height: 20 }
    ]
  };
};