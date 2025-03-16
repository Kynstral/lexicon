// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  CreditCard as CardIcon,
  DollarSign,
  Landmark,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/components/AuthStatusProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const Checkout = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, setCart } =
    useCart();
  const [checkoutMode, setCheckoutMode] = useState<"purchase" | "lending">(
    "purchase",
  );
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const isBookStore = userRole === "Book Store";
  const borrowText = isBookStore ? "Rent" : "Borrow";

  const calculateItemPrice = (item, isRental) => {
    return isRental ? item.price * 0.6 : item.price;
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) =>
        sum +
        calculateItemPrice(item, checkoutMode === "lending") * item.quantity,
      0,
    );
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  useEffect(() => {
    const savedCart = localStorage.getItem("bookshopCart");
    if (savedCart && JSON.parse(savedCart).length > 0) {
      setCart(JSON.parse(savedCart));
    }
  }, [setCart]);

  useEffect(() => {
    localStorage.setItem("bookshopCart", JSON.stringify(cart));
  }, [cart]);

  const handleRemoveItem = (bookId: string) => {
    removeFromCart(bookId);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleQuantityChange = (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(bookId, newQuantity);
  };

  const handleMemberSearch = async (query: string) => {
    if (!query || query.trim() === "") {
      setMemberSearchResults([]);
      return;
    }

    setIsSearchingMembers(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, email, phone")
        .or(
          `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
        )
        .order("name");

      if (error) throw error;
      setMemberSearchResults(data || []);
    } catch (error) {
      console.error("Error searching members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search members.",
      });
      setMemberSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleMemberSelect = (member: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }) => {
    setSelectedMember(member);
    setMemberSearchOpen(false);
    setMemberSearchQuery(member.name || "");
  };

  const handleCheckout = async () => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to checkout.",
      });
      return;
    }

    if (!selectedMember) {
      toast({
        variant: "destructive",
        title: "Member Required",
        description: "Please select a member to complete the checkout.",
      });
      return;
    }

    if (checkoutMode === "purchase" && !paymentMethod) {
      toast({
        variant: "destructive",
        title: "Payment Method Required",
        description: "Please select a payment method.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      for (const item of cart) {
        if (checkoutMode === "lending") {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);

          const { error: borrowError } = await supabase
            .from("borrowings")
            .insert([
              {
                book_id: item.bookId,
                member_id: selectedMember.id,
                due_date: dueDate.toISOString(),
                status: "Borrowed",
                checkout_date: new Date().toISOString(),
                user_id: user.id,
                quantity: item.quantity,
                reminder_sent: false,
                reminder_date: new Date().toISOString(),
              },
            ]);

          if (borrowError) throw borrowError;
        }

        const itemPrice = calculateItemPrice(item, checkoutMode === "lending");

        const { data: transactionData, error: checkoutError } = await supabase
          .from("checkout_transactions")
          .insert([
            {
              customer_id: selectedMember.id,
              status: "Completed" as TransactionStatus,
              payment_method:
                checkoutMode === "lending"
                  ? isBookStore
                    ? "Rent"
                    : "Borrow"
                  : paymentMethod,
              total_amount: itemPrice * item.quantity,
              date: new Date().toISOString(),
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (checkoutError) throw checkoutError;

        const { error: itemError } = await supabase
          .from("checkout_items")
          .insert([
            {
              transaction_id: transactionData.id,
              title: item.title,
              quantity: item.quantity,
              price: itemPrice,
              book_id: item.bookId,
            },
          ]);

        if (itemError) throw itemError;

        const { data: bookData, error: bookFetchError } = await supabase
          .from("books")
          .select("stock")
          .eq("id", item.bookId)
          .single();

        if (bookFetchError) throw bookFetchError;

        const newStock = bookData.stock - item.quantity;
        const newStatus = newStock > 0 ? "Available" : "Checked Out";

        const { error: updateError } = await supabase
          .from("books")
          .update({
            stock: newStock,
            status: newStatus,
          })
          .eq("id", item.bookId);

        if (updateError) throw updateError;
      }

      clearCart();
      localStorage.removeItem("bookshopCart");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: "There was an error processing your checkout.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    navigate("/catalog");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <main className="container mx-auto px-4">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="pl-0">
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-1">
            {cart.length} {cart.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Empty cart state */}
        {cart.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="bg-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/60" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Looks like you haven't added any books to your cart yet. Browse
              our catalog to find your next great read.
            </p>
            <Button size="lg" asChild>
              <Link to="/catalog">Browse Books</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Cart items and checkout form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart items */}
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-primary/70" />
                    Cart Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div>
                    {cart.map((item, index) => (
                      <div
                        key={item.bookId}
                        className={`flex items-center p-4 hover:bg-muted/20 transition-colors ${
                          index !== cart.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="h-24 w-16 bg-muted rounded overflow-hidden flex-shrink-0 mr-4 shadow-sm">
                          <img
                            src={item.coverImage || "/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 mr-4">
                          <h4 className="font-medium truncate mb-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center text-sm">
                            <span className="font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="mx-2 text-muted-foreground">
                              ×
                            </span>
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-r-none"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.bookId,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-l-none"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.bookId,
                                    item.quantity + 1,
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right mr-2">
                            <p className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.bookId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Checkout Type Selector - Redesigned */}
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-lg">Checkout Options</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* New Custom Tabs Design */}
                  <div className="grid grid-cols-2 border-b">
                    <button
                      onClick={() => setCheckoutMode("purchase")}
                      className={`flex items-center justify-center gap-3 py-6 transition-all relative
                        ${
                          checkoutMode === "purchase"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/40"
                        }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>Purchase</span>
                      {checkoutMode === "purchase" && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setCheckoutMode("lending")}
                      className={`flex items-center justify-center gap-3 py-6 transition-all relative
                        ${
                          checkoutMode === "lending"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/40"
                        }`}
                    >
                      <Calendar className="h-5 w-5" />
                      <span>{borrowText}</span>
                      {checkoutMode === "lending" && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
                      )}
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Member Selection - Same for both modes */}
                    <div className="bg-muted/20 p-5 rounded-lg border border-border/50">
                      <h3 className="font-medium mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary/70" />
                        Select Member
                      </h3>
                      <div className="space-y-2">
                        <Popover
                          open={memberSearchOpen}
                          onOpenChange={setMemberSearchOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={memberSearchOpen}
                              className="w-full justify-between"
                            >
                              {selectedMember ? (
                                <div className="flex items-center space-x-2">
                                  <span>{selectedMember.name}</span>
                                </div>
                              ) : (
                                <span>Search for a member...</span>
                              )}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[400px] p-0"
                            align="start"
                          >
                            <div className="border rounded-md overflow-hidden">
                              <div className="flex items-center border-b px-2">
                                <Search className="h-4 w-4 mr-2" />
                                <Input
                                  placeholder="Search members..."
                                  value={memberSearchQuery}
                                  onChange={(e) => {
                                    setMemberSearchQuery(e.target.value);
                                    handleMemberSearch(e.target.value);
                                  }}
                                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {isSearchingMembers ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  </div>
                                ) : memberSearchResults.length > 0 ? (
                                  memberSearchResults.map((member) => (
                                    <div
                                      key={member.id}
                                      onClick={() => handleMemberSelect(member)}
                                      className="p-2 hover:bg-muted cursor-pointer flex items-center space-x-2"
                                    >
                                      <User className="h-4 w-4" />
                                      <span>{member.name}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 text-sm text-muted-foreground">
                                    No members found.
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {selectedMember && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  {selectedMember.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium">
                                    {selectedMember.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedMember.email ||
                                      "No email provided"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => setSelectedMember(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mode-specific content */}
                    {checkoutMode === "purchase" && (
                      <div className="bg-muted/20 p-5 rounded-lg border border-border/50">
                        <h3 className="font-medium mb-4 flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-primary/70" />
                          Payment Method
                        </h3>

                        {/* Redesigned Payment Method Selection */}
                        <div className="space-y-3">
                          <div
                            className={`flex items-center p-4 rounded-md cursor-pointer transition-all
                              ${
                                paymentMethod === "cash"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card hover:bg-muted border"
                              }`}
                            onClick={() => setPaymentMethod("cash")}
                          >
                            <div className="flex items-center flex-1">
                              <div
                                className={`mr-3 ${paymentMethod === "cash" ? "text-primary-foreground" : "text-muted-foreground"}`}
                              >
                                <DollarSign className="h-5 w-5" />
                              </div>
                              <span className="font-medium">Cash</span>
                            </div>
                            {paymentMethod === "cash" && (
                              <div className="bg-white/20 h-5 w-5 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex items-center p-4 rounded-md cursor-pointer transition-all
                              ${
                                paymentMethod === "card"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card hover:bg-muted border"
                              }`}
                            onClick={() => setPaymentMethod("card")}
                          >
                            <div className="flex items-center flex-1">
                              <div
                                className={`mr-3 ${paymentMethod === "card" ? "text-primary-foreground" : "text-muted-foreground"}`}
                              >
                                <CardIcon className="h-5 w-5" />
                              </div>
                              <span className="font-medium">Card</span>
                            </div>
                            {paymentMethod === "card" && (
                              <div className="bg-white/20 h-5 w-5 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex items-center p-4 rounded-md cursor-pointer transition-all
                              ${
                                paymentMethod === "bank_transfer"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card hover:bg-muted border"
                              }`}
                            onClick={() => setPaymentMethod("bank_transfer")}
                          >
                            <div className="flex items-center flex-1">
                              <div
                                className={`mr-3 ${paymentMethod === "bank_transfer" ? "text-primary-foreground" : "text-muted-foreground"}`}
                              >
                                <Landmark className="h-5 w-5" />
                              </div>
                              <span className="font-medium">Bank Transfer</span>
                            </div>
                            {paymentMethod === "bank_transfer" && (
                              <div className="bg-white/20 h-5 w-5 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {checkoutMode === "lending" && (
                      <div className="bg-muted/20 p-5 rounded-lg border border-border/50">
                        <h3 className="font-medium mb-3 flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary/70" />
                          {borrowText} Information
                        </h3>
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">
                                14-Day {borrowText} Period
                              </p>
                              <p className="text-sm text-blue-600">
                                Books must be returned within 14 days from
                                checkout
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-green-50 text-green-700 rounded-md border border-green-100">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">40% Discount</p>
                              <p className="text-sm text-green-600">
                                {borrowText}ing is 40% cheaper than purchasing
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border shadow-sm sticky top-4">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.bookId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground flex-1 truncate">
                          {item.title}{" "}
                          <span className="text-muted-foreground/60">
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="font-medium">
                          $
                          {(
                            calculateItemPrice(
                              item,
                              checkoutMode === "lending",
                            ) * item.quantity
                          ).toFixed(2)}
                          {checkoutMode === "lending" && (
                            <span className="ml-1 text-xs text-green-600">
                              -40%
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between font-medium text-lg py-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col space-y-4">
                  <Button
                    className="w-full py-6"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing || !selectedMember}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {checkoutMode === "purchase" ? (
                      <span className="flex items-center">
                        Confirm Purchase
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Confirm {borrowText}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By completing this transaction, you agree to our Terms of
                    Service and Privacy Policy.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Redesigned Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {checkoutMode === "purchase"
                    ? "Purchase Successful"
                    : `${borrowText} Successful`}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  {checkoutMode === "purchase"
                    ? "Your purchase has been completed successfully."
                    : `The books have been ${borrowText.toLowerCase()}ed successfully.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="my-4">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Transaction Details
              </h3>
              <Badge
                variant={checkoutMode === "purchase" ? "default" : "outline"}
                className="text-xs"
              >
                {checkoutMode === "purchase" ? "Purchase" : borrowText}
              </Badge>
            </div>

            <div className="bg-muted/20 p-4 rounded-lg border space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium">{selectedMember?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">
                  {cart.length} {cart.length === 1 ? "book" : "books"}
                </span>
              </div>
              {checkoutMode === "purchase" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
              )}
              {checkoutMode === "lending" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">
                    {new Date(
                      new Date().setDate(new Date().getDate() + 14),
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Book previews */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              {checkoutMode === "purchase"
                ? "Purchased Items"
                : `${borrowText}ed Items`}
            </h3>
            <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.bookId}
                  className="flex items-center p-3 bg-muted/10 rounded-md border"
                >
                  <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0 mr-3">
                    <img
                      src={item.coverImage || "/placeholder.svg"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        $
                        {(
                          calculateItemPrice(item, checkoutMode === "lending") *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCloseSuccess}
              className="sm:flex-1"
            >
              View Catalog
            </Button>
            <Button onClick={handleCloseSuccess} className="sm:flex-1">
              {checkoutMode === "purchase" ? "Continue Shopping" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
