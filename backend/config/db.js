import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://FoodDb:amit8787@cluster0.rmxxc2w.mongodb.net/food-del').then(()=>console.log("DB Connected"))
}