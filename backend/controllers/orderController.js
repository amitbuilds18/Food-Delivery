import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

//  Stripe init with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// placing user order
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    //  safety check
    if (!req.body.items || req.body.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    //  create order
    const newOrder = new orderModel({
      userId: req.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();

    //  clear cart
    await userModel.findByIdAndUpdate(req.userId, { cartData: {} });

    //  create stripe line items
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, //  correct (paise)
      },
      quantity: item.quantity,
    }));

    // delivery charges
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 2 * 100,
      },
      quantity: 1,
    });

    //  stripe session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    //  response
    res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.log("Stripe Error:", error.message);

    //  show real error
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOrder = async (req,res) => {
    const {orderId,success} = req.body;
    try {
        if (success=="true") {
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            req.json({success:true,message:"paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:"Not Paid"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
        
        
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
     try {
         const orders = await orderModel.find({userId:req.userId});
         res.json({success:true,data:orders});

     } catch (error) {
          console.log(error);
          res.json({success:false,message:"Error"})
      
     }
}

// Listing orders for admin panel
const listOrders = async (req,res) => {
    try {
       const orders = await orderModel.find({});
       res.json({success:true,data:orders})
    } catch (error) {
      console.log(error);
      res.json({success:false,message:"Error"})
      
      
    }
}

// api for updating order status
const updateStatus = async (req,res) => {
  try {
      await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
      res.json({success:true,message:"Status Updated"})
  } catch (error) {
     console.log(error);
     res.json({success:false,message:"Error"})
     
  }
}


export {placeOrder,verifyOrder,userOrders,listOrders, updateStatus};