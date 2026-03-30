// __tests__/app/(cashier)/cart.test.tsx
import React from "react";
import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { BackHandler } from "react-native";
import CartScreen from "@/app/(cashier)/cart";
import { useCart } from "@/context/CartContext";

type MockUseCart = jest.MockedFunction<typeof useCart>;

// Mock the router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
  },
}));

// Mock the cart context
jest.mock("@/context/CartContext", () => ({
  useCart: jest.fn(),
}));

// Mock BackHandler
jest.mock("react-native/Libraries/Utilities/BackHandler", () => ({
  addEventListener: jest.fn((eventName, callback) => ({
    remove: jest.fn(),
  })),
  removeEventListener: jest.fn(),
}));

// Mock Ionicons
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");

// Mock the child components
jest.mock("@/components/cart/AddItemBox", () => {
  const MockAddItemBox = ({ onAddItem, onSearch, onBarcodeScan }: any) => (
    <div data-testid="add-item-box">
      <button onClick={onAddItem} data-testid="add-item-button">
        Add Item
      </button>
      <button onClick={onSearch} data-testid="search-button">
        Search
      </button>
      <button onClick={onBarcodeScan} data-testid="barcode-button">
        Scan
      </button>
    </div>
  );
  return MockAddItemBox;
});

jest.mock("@/components/cart/CartItem", () => {
  const MockCartItem = ({ item, onRemove, onPress }: any) => (
    <div data-testid={`cart-item-${item.id}`}>
      <span>{item.name}</span>
      <span>{item.price}</span>
      <span>{item.quantity}</span>
      <button onClick={() => onPress()} data-testid={`item-${item.id}-press`}>
        Press
      </button>
      <button
        onClick={() => onRemove(item.id)}
        data-testid={`item-${item.id}-remove`}
      >
        Remove
      </button>
    </div>
  );
  return MockCartItem;
});

jest.mock("@/components/modal/ClearCartModal", () => {
  const MockClearCartModal = ({
    visible,
    onClose,
    onConfirm,
    itemCount,
  }: any) =>
    visible ? (
      <div data-testid="clear-cart-modal">
        <span>Clear {itemCount} items?</span>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        <button onClick={onConfirm} data-testid="modal-confirm-clear">
          Confirm Clear
        </button>
      </div>
    ) : null;
  return MockClearCartModal;
});

jest.mock("@/components/modal/ExitCartModal", () => {
  const MockExitCartModal = ({
    visible,
    onClose,
    onClearAndExit,
    onExit,
    itemCount,
  }: any) =>
    visible ? (
      <div data-testid="exit-cart-modal">
        <span>Exit with {itemCount} items?</span>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        <button onClick={onClearAndExit} data-testid="modal-clear-and-exit">
          Clear & Exit
        </button>
        <button onClick={onExit} data-testid="modal-exit">
          Exit Only
        </button>
      </div>
    ) : null;
  return MockExitCartModal;
});

jest.mock("@/components/modal/ProductModal", () => {
  const MockProductModal = ({
    visible,
    onClose,
    onAddToCart,
    product,
    initialQuantity,
    isEditMode,
  }: any) =>
    visible ? (
      <div data-testid="product-modal">
        <span>{product.name}</span>
        <span>Quantity: {initialQuantity}</span>
        <button
          onClick={() => onAddToCart(5)}
          data-testid="modal-update-quantity"
        >
          Update to 5
        </button>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
      </div>
    ) : null;
  return MockProductModal;
});

// Mock the Header component
jest.mock("@/components/layout/Header", () => {
  const MockHeader = ({ title, showBackButton, onBackPress }: any) => (
    <div data-testid="header">
      <span>{title}</span>
      {showBackButton && (
        <button onClick={onBackPress} data-testid="back-button">
          Back
        </button>
      )}
    </div>
  );
  return MockHeader;
});

describe("CartScreen", () => {
  // Mock data
  const mockCartContext = {
    cartItems: [],
    formattedTotal: "$0.00",
    loading: false,
    hasItems: false,
    itemCount: 0,
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    confirmPurchase: jest.fn(),
    clearCart: jest.fn(),
  };

  const mockCartItems = [
    {
      id: 1,
      name: "Test Product 1",
      price: 10.99,
      quantity: 2,
      stock_quantity: 10,
      category: "Test Category",
      image: "test.jpg",
      description: "Test Description",
    },
    {
      id: 2,
      name: "Test Product 2",
      price: 15.99,
      quantity: 1,
      stock_quantity: 5,
      category: "Another Category",
      image: "test2.jpg",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useCart as MockUseCart).mockReturnValue(mockCartContext as any);
  });

  // ==================== RENDERING TESTS ====================

  describe("Rendering", () => {
    test("renders header with title", () => {
      const { getByText } = render(<CartScreen />);
      expect(getByText("CART")).toBeTruthy();
    });

    test("renders empty cart state when no items", () => {
      // FIXED: Destructure getByTestId from render
      const { getByText, getByTestId, queryByTestId } = render(<CartScreen />);

      expect(getByText("The Cart is Empty")).toBeTruthy();
      expect(getByText(/Looks like you haven't added/)).toBeTruthy();
      expect(queryByTestId("cart-item-1")).toBeNull();
      expect(getByTestId("add-item-box")).toBeTruthy();
    });

    test("renders cart with items when hasItems is true", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        formattedTotal: "$38.97",
      } as any);

      const { getByText, getByTestId } = render(<CartScreen />);

      expect(getByTestId("cart-item-1")).toBeTruthy();
      expect(getByTestId("cart-item-2")).toBeTruthy();
      expect(getByText("Subtotal:")).toBeTruthy();
      expect(getByText("$38.97")).toBeTruthy();
      expect(getByText("Items:")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("Total:")).toBeTruthy();
      expect(getByText("Confirm payment · $38.97")).toBeTruthy();
      expect(getByText("Clear Cart")).toBeTruthy();
    });

    test("renders loading state", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        loading: true,
      } as any);

      const { getByText } = render(<CartScreen />);
      expect(getByText("Processing...")).toBeTruthy();
    });
  });

  // ==================== NAVIGATION TESTS ====================

  describe("Navigation", () => {
    test("navigates to product screen when Add Item button is pressed", () => {
      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("add-item-button"));

      expect(router.push).toHaveBeenCalledWith("/(cashier)/sell/product");
    });

    test("navigates to cashier when back button pressed with empty cart", () => {
      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("back-button"));

      expect(router.dismissAll).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(cashier)");
    });
  });

  // ==================== CART OPERATIONS TESTS ====================

  describe("Cart Operations", () => {
    test("opens clear cart modal when Clear Cart button pressed", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
      } as any);

      const { getByText, getByTestId } = render(<CartScreen />);

      fireEvent.press(getByText("Clear Cart"));

      expect(getByTestId("clear-cart-modal")).toBeTruthy();
    });

    test("clears cart when confirmed in clear cart modal", () => {
      const mockClearCart = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        clearCart: mockClearCart,
      } as any);

      const { getByText, getByTestId } = render(<CartScreen />);

      fireEvent.press(getByText("Clear Cart"));
      fireEvent.press(getByTestId("modal-confirm-clear"));

      expect(mockClearCart).toHaveBeenCalled();
    });

    test("removes item when remove button pressed", () => {
      const mockRemoveItem = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        removeItem: mockRemoveItem,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("item-1-remove"));

      expect(mockRemoveItem).toHaveBeenCalledWith(1);
    });

    test("confirms purchase when confirm button pressed", () => {
      const mockConfirmPurchase = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        formattedTotal: "$38.97",
        confirmPurchase: mockConfirmPurchase,
      } as any);

      const { getByText } = render(<CartScreen />);

      fireEvent.press(getByText("Confirm payment · $38.97"));

      expect(mockConfirmPurchase).toHaveBeenCalled();
    });

    test("disables confirm button when loading", () => {
      const mockConfirmPurchase = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        loading: true,
        confirmPurchase: mockConfirmPurchase,
      } as any);

      const { getByText } = render(<CartScreen />);

      fireEvent.press(getByText("Confirm payment · $38.97"));

      expect(mockConfirmPurchase).not.toHaveBeenCalled();
    });
  });

  // ==================== PRODUCT MODAL TESTS ====================

  describe("Product Modal", () => {
    test("opens product modal when cart item pressed", () => {
      const mockUpdateQuantity = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        updateQuantity: mockUpdateQuantity,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("item-1-press"));

      expect(getByTestId("product-modal")).toBeTruthy();
    });

    test("updates quantity from product modal", () => {
      const mockUpdateQuantity = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        updateQuantity: mockUpdateQuantity,
      } as any);

      const { getByTestId, queryByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("item-1-press"));
      fireEvent.press(getByTestId("modal-update-quantity"));

      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 5);
      expect(queryByTestId("product-modal")).toBeNull();
    });

    test("closes product modal without updating", () => {
      const mockUpdateQuantity = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        updateQuantity: mockUpdateQuantity,
      } as any);

      const { getByTestId, queryByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("item-1-press"));
      fireEvent.press(getByTestId("modal-close"));

      expect(queryByTestId("product-modal")).toBeNull();
      expect(mockUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  // ==================== EXIT MODAL TESTS ====================

  describe("Exit Modal", () => {
    test("shows exit modal when back pressed with items", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("back-button"));

      expect(getByTestId("exit-cart-modal")).toBeTruthy();
    });

    test("clears cart and exits when Clear & Exit pressed", () => {
      const mockClearCart = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        clearCart: mockClearCart,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("back-button"));
      fireEvent.press(getByTestId("modal-clear-and-exit"));

      expect(mockClearCart).toHaveBeenCalled();
      expect(router.dismissAll).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(cashier)");
    });

    test("exits without clearing when Exit Only pressed", () => {
      const mockClearCart = jest.fn();
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
        clearCart: mockClearCart,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("back-button"));
      fireEvent.press(getByTestId("modal-exit"));

      expect(mockClearCart).not.toHaveBeenCalled();
      expect(router.dismissAll).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(cashier)");
    });

    test("closes exit modal without exiting", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
      } as any);

      const { getByTestId, queryByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("back-button"));
      fireEvent.press(getByTestId("modal-close"));

      expect(queryByTestId("exit-cart-modal")).toBeNull();
      expect(router.dismissAll).not.toHaveBeenCalled();
    });
  });

  // ==================== BACK HANDLER TESTS ====================

  describe("Back Handler", () => {
    test("adds back handler on focus", () => {
      render(<CartScreen />);

      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function),
      );
    });

    test("shows exit modal when hardware back pressed with items", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: mockCartItems,
        hasItems: true,
        itemCount: 3,
      } as any);

      render(<CartScreen />);

      const addEventListenerMock = BackHandler.addEventListener as jest.Mock;
      // FIXED: Type the callback properly
      const callback = addEventListenerMock.mock.calls[0][1] as () => boolean;
      const result = callback();

      expect(result).toBe(true);
    });

    test("navigates directly when hardware back pressed with empty cart", () => {
      render(<CartScreen />);

      const addEventListenerMock = BackHandler.addEventListener as jest.Mock;
      // FIXED: Type the callback properly
      const callback = addEventListenerMock.mock.calls[0][1] as () => boolean;
      const result = callback();

      expect(result).toBe(true);
      expect(router.dismissAll).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(cashier)");
    });
  });

  // ==================== EDGE CASES ====================

  describe("Edge Cases", () => {
    test("handles items with missing stock_quantity", () => {
      const itemsWithMissingStock = [
        {
          id: 3,
          name: "No Stock Item",
          price: 5.99,
          quantity: 1,
          category: "Test",
          image: "test.jpg",
        },
      ];

      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: itemsWithMissingStock,
        hasItems: true,
        itemCount: 1,
      } as any);

      const { getByTestId } = render(<CartScreen />);

      fireEvent.press(getByTestId("item-3-press"));

      expect(getByTestId("product-modal")).toBeTruthy();
    });

    test("handles zero items count correctly", () => {
      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: [],
        hasItems: false,
        itemCount: 0,
      } as any);

      const { getByText, queryByText } = render(<CartScreen />);

      expect(getByText("The Cart is Empty")).toBeTruthy();
      expect(queryByText("Clear Cart")).toBeNull();
    });

    test("handles large number of items", () => {
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: 9.99,
        quantity: 1,
        stock_quantity: 100,
        category: "Test",
        image: "test.jpg",
      }));

      (useCart as MockUseCart).mockReturnValue({
        ...mockCartContext,
        cartItems: manyItems,
        hasItems: true,
        itemCount: 50,
        formattedTotal: "$499.50",
      } as any);

      const { getByText } = render(<CartScreen />);

      expect(getByText("Items:")).toBeTruthy();
      expect(getByText("50")).toBeTruthy();
      expect(getByText("$499.50")).toBeTruthy();
    });
  });
});
