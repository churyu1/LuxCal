
export enum SurfaceType {
  CEILING = 'CEILING',
  WALL_EAST = 'WALL_EAST',
  WALL_WEST = 'WALL_WEST',
  SLOPE_EAST = 'SLOPE_EAST',
  SLOPE_WEST = 'SLOPE_WEST'
}

export interface LightSource {
  id: string;
  name: string;
  surface: SurfaceType;
  u: number; // Normalized coordinate on surface (0-1)
  v: number; // Normalized coordinate on surface (0-1)
  lumens: number;
  color: string;
  pitch: number; // Pitch in meters. If > 0, replicate along the primary axis
}

export interface RoomConfig {
  width: number;
  depth: number;
  height: number;
  chamfer: number; // Size of the 45 degree slope
  workPlaneHeight: number; // Height of the measurement plane for FLOOR mode
  // Body dimensions for inspection mode
  bodyWidth: number;
  bodyHeight: number;
  bodyLength: number;
  bodyClearance: number; // Height from floor to body bottom
}

export interface CalculationResult {
  x: number;
  y: number; 
  z: number;
  lux: number;
  surfaceType: 'FLOOR' | 'BODY_TOP' | 'BODY_SIDE' | 'BODY_FRONT' | 'BODY_BACK';
}
