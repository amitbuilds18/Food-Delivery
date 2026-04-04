import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

  const [cartItems, setCartItems] = useState({});
  const [food_list, setFoodList] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const url = "http://localhost:4000";

  // ADD TO CART (SAFE)
  const addToCart = async (itemId) => {

    setCartItems((prev) => {
      const updatedCart = { ...prev };

      if (!updatedCart[itemId]) {
        updatedCart[itemId] = 1;
      } else {
        updatedCart[itemId] += 1;
      }

      return updatedCart;
    });

    try {
      if (token) {
        await axios.post(
          url + "/api/cart/add",
          { itemId },
          { headers: { token } }
        );
      }
    } catch (error) {
      console.log("Add to cart error:", error);
    }
  };

  //  REMOVE FROM CART (SAFE)
  const removeFromCart = async (itemId) => {

    setCartItems((prev) => {
      const updatedCart = { ...prev };

      if (updatedCart[itemId] > 1) {
        updatedCart[itemId] -= 1;
      } else {
        delete updatedCart[itemId];
      }

      return updatedCart;
    });

    try {
      if (token) {
        await axios.post(
          url + "/api/cart/remove",
          { itemId },
          { headers: { token } }
        );
      }
    } catch (error) {
      console.log("Remove from cart error:", error);
    }
  };

  //  TOTAL CALCULATION (CRASH-PROOF)
  const getTotalCartAmount = () => {
    let totalAmount = 0;

    for (const item in cartItems) {
      if (cartItems[item] > 0) {

        const itemInfo = food_list.find(
          (product) => product._id === item
        );

        if (!itemInfo) continue; // 🔥 prevent crash

        totalAmount += itemInfo.price * cartItems[item];
      }
    }

    return totalAmount;
  };

  //  FETCH FOOD LIST
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      setFoodList(response.data.data);
    } catch (error) {
      console.log("Food list error:", error);
    }
  };

  //  LOAD CART DATA FROM BACKEND
  const loadCartData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token } }
      );

      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.log("Cart load error:", error);
    }
  };

  //  INITIAL LOAD
  useEffect(() => {

    const loadData = async () => {
      await fetchFoodList();

      const savedToken = localStorage.getItem("token");

      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
      }
    };

    loadData();

  }, []);

  //  CONTEXT VALUE
  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;