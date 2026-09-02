import mongoose, { Schema, models, model, Model, Document } from 'mongoose'

interface ISubscriber extends Document {
  email: string
  name?: string
  createdAt: Date
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'newsletter_subscribers' }
)

const Subscriber = (models.Subscriber as Model<ISubscriber>) || model<ISubscriber>('Subscriber', SubscriberSchema)
export default Subscriber
