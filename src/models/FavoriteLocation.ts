import mongoose, { Schema, Document } from 'mongoose';

export interface IFavoriteLocation extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  lat: number;
  lon: number;
  country: string;
  isDefault: boolean;
  weatherData?: {
    temperature: number;
    description: string;
    icon: string;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteLocationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lon: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    weatherData: {
      temperature: Number,
      description: String,
      icon: String,
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
FavoriteLocationSchema.index({ userId: 1, name: 1 }, { unique: true });
FavoriteLocationSchema.index({ userId: 1, lat: 1, lon: 1 });
FavoriteLocationSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default location per user
FavoriteLocationSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await FavoriteLocation.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const FavoriteLocation = mongoose.model<IFavoriteLocation>(
  'FavoriteLocation',
  FavoriteLocationSchema
);
