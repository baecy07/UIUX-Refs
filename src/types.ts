export type Platform = 'Mobile' | 'PC' | 'Console' | 'Cross-platform';
export type Orientation = 'Landscape' | 'Portrait';

export interface Game {
  id: string;
  name: string;
  platform: Platform;
  genre: string;
  orientation: Orientation;
  description: string;
  coverImagePath: string | null;
  coverThumbPath: string | null;
  sortOrder: number;
  screenshotCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Screenshot {
  id: string;
  gameId: string;
  feature: string;
  title: string;
  imagePath: string;
  thumbPath: string;
  width: number | null;
  height: number | null;
  orderIndex: number;
  memo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  game?: Game;
}

export interface Flow {
  id: string;
  gameId: string;
  fromScreenId: string;
  toScreenId: string;
  action: string;
  orderIndex: number;
  createdAt: string;
}

export interface AppSettings {
  id: 'default';
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GameFormInput {
  name: string;
  platform: Platform;
  genre: string;
  orientation: Orientation;
  description: string;
  sortOrder: number;
}

export interface ScreenshotMetadataInput {
  title: string;
  feature: string;
  memo: string;
  tags: string[];
  orderIndex: number;
}

export type ViewMode = 'games' | 'gameDetail' | 'featureCompare' | 'upload' | 'settings';
