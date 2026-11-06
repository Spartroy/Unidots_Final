import mongoose from 'mongoose';

// One document holding the rates used to suggest quotes. Rates are per cm2 per color, by plate thickness.
const priceListSchema = mongoose.Schema(
  {
    currency: { type: String, default: 'EGP' },
    ratePerCm2PerColor: {
      t114: { type: Number, default: 0, min: 0 }, // 1.14 mm
      t170: { type: Number, default: 0, min: 0 }, // 1.7 mm
      t254: { type: Number, default: 0, min: 0 }, // 2.54 mm
    },
    minimumCharge: { type: Number, default: 0, min: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

priceListSchema.statics.getCurrent = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.model('PriceList', priceListSchema);
