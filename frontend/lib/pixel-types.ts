export type Pixel = {
  _id: string;
  name: string;
  pixelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PixelInput = Pick<Pixel, "name" | "pixelId" | "isActive">;
