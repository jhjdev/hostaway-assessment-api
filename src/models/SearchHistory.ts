import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchHistory extends Document {
  userId: mongoose.Types.ObjectId;
  query: string;
  location: {
    name: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  weatherData?: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  };
  timestamp: Date;
}

const SearchHistorySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      lat: {
        type: Number,
      },
      lon: {
        type: Number,
      },
    },
    weatherData: {
      temperature: Number,
      description: String,
      humidity: Number,
      windSpeed: Number,
      icon: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for performance
SearchHistorySchema.index({ userId: 1, timestamp: -1 });
SearchHistorySchema.index({ query: 1 });

export const SearchHistory = mongoose.model<ISearchHistory>(
  'SearchHistory',
  SearchHistorySchema
);
