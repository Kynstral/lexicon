/* eslint-disable react-hooks/exhaustive-deps */
// noinspection ExceptionCaughtLocallyJS

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthStatusProvider";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface CheckoutItem {
  id: string;
  transaction_id: string;
  title: string;
  quantity: number;
  price: number;
  book_id: string;
  return_status?: string;
  coverImage?: string;
}

interface CheckoutTransaction {
  id: string;
  customer_id: string;
  status: string;
  payment_method: string;
  total_amount: number;
  date: string;
  user_id?: string;

  memberName?: string;
  memberEmail?: string;
}

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const TRANSACTIONS_PER_PAGE = 10;

const formatPaymentMethod = (method) => {
  if (method === "bank_transfer") return "Bank Transfer";
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  if (method === "Borrow") return "Borrow";
  if (method === "Rent") return "Rent";
  return method.charAt(0).toUpperCase() + method.slice(1);
};

const Transactions = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [transactions, setTransactions] = useState<CheckoutTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    CheckoutTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<CheckoutTransaction | null>(null);
  const [transactionItems, setTransactionItems] = useState<CheckoutItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const isBookStore = userRole === "Book Store";
  const borrowText = isBookStore ? "Rent" : "Borrow";

  useEffect(() => {
    if (memberSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [memberSearchOpen]);

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);

    if (range === "custom") {
      setShowCustomDateInputs(true);
      return;
    }

    setShowCustomDateInputs(false);

    const today = new Date();
    const start = new Date();

    if (range === "30days") {
      start.setDate(today.getDate() - 30);
    } else if (range === "60days") {
      start.setDate(today.getDate() - 60);
    } else if (range === "90days") {
      start.setDate(today.getDate() - 90);
    } else {
      setStartDate("");
      setEndDate("");
      applyFilters();
      return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);

    setTimeout(() => applyFilters(), 100);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedDateRange("all");
    setShowCustomDateInputs(false);
    setSelectedMember(null);
    setMemberSearchQuery("");
    setPage(0);
    setTransactions([]);
    setFilteredTransactions([]);
    setHasMore(true);
    fetchTransactions(0);
  };

  const applyFilters = () => {
    setPage(0);
    setTransactions([]);
    setFilteredTransactions([]);
    setHasMore(true);
    fetchTransactions(0);
  };

  const fetchBookCovers = async (items: CheckoutItem[]) => {
    const bookIds = items.map((item) => item.book_id).filter((id) => id);
    if (bookIds.length === 0) return items;

    try {
      const { data: books, error } = await supabase
        .from("books")
        .select("id, cover_image")
        .in("id", bookIds);

      if (error) throw error;

      const coverMap = {};
      books?.forEach((book) => {
        coverMap[book.id] = book.cover_image;
      });

      return items.map((item) => ({
        ...item,
        coverImage: item.book_id ? coverMap[item.book_id] : undefined,
      }));
    } catch (error) {
      console.error("Error fetching book covers:", error);
      return items;
    }
  };

  const fetchMemberData = async (transactions: CheckoutTransaction[]) => {
    const customerIds = [
      ...new Set(transactions.map((t) => t.customer_id)),
    ].filter((id) => id);

    if (customerIds.length === 0) return transactions;

    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("id, name, email")
        .in("id", customerIds);

      if (error) throw error;

      const memberMap = {};
      members?.forEach((member) => {
        memberMap[member.id] = member;
      });

      return transactions.map((transaction) => {
        const member = transaction.customer_id
          ? memberMap[transaction.customer_id]
          : null;
        return {
          ...transaction,
          memberName: member?.name || "Unknown",
          memberEmail: member?.email || undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching member data:", error);
      return transactions;
    }
  };

  const fetchTransactions = async (pageNumber: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("checkout_transactions")
        .select(
          "id, customer_id, status, payment_method, total_amount, date, user_id",
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .range(
          pageNumber * TRANSACTIONS_PER_PAGE,
          (pageNumber + 1) * TRANSACTIONS_PER_PAGE - 1,
        );

      if (startDate) {
        query = query.gte("date", startDate + "T00:00:00");
      }
      if (endDate) {
        query = query.lte("date", endDate + "T23:59:59");
      }

      if (selectedMember) {
        query = query.eq("customer_id", selectedMember.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enhancedData = await fetchMemberData(data || []);

      if (pageNumber === 0) {
        setTransactions(enhancedData);
        setFilteredTransactions(enhancedData);
      } else {
        setTransactions((prev) => [...prev, ...enhancedData]);
        setFilteredTransactions((prev) => [...prev, ...enhancedData]);
      }

      setHasMore((data?.length || 0) === TRANSACTIONS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreTransactions = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
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

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setMemberSearchOpen(false);
    setMemberSearchQuery(member.name);
  };

  const clearMemberFilter = () => {
    setSelectedMember(null);
    setMemberSearchQuery("");
  };

  const handleViewTransaction = async (transaction: CheckoutTransaction) => {
    setSelectedTransaction(transaction);
    setIsLoadingItems(true);
    setTransactionDialogOpen(true);
    setTransactionItems([]);

    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("checkout_items")
        .select("*")
        .eq("transaction_id", transaction.id);

      if (itemsError) throw itemsError;

      if (itemsData && itemsData.length > 0) {
        const itemsWithCovers = await fetchBookCovers(itemsData);
        setTransactionItems(itemsWithCovers);
      }
    } catch (error) {
      console.error("Error fetching transaction items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transaction details.",
      });
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions(0);
    }
  }, [user?.id]);

  const getPaymentMethodDisplay = (method) => {
    const formattedMethod = formatPaymentMethod(method);

    if (method === "Borrow" || method === "Rent") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200"
        >
          {formattedMethod}
        </Badge>
      );
    }

    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";

    if (method === "cash") {
      bgColor = "bg-green-50";
      textColor = "text-green-700";
    } else if (method === "card") {
      bgColor = "bg-purple-50";
      textColor = "text-purple-700";
    } else if (method === "bank_transfer") {
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
    }

    return (
      <Badge
        variant="outline"
        className={`${bgColor} ${textColor} border-transparent font-medium`}
      >
        {formattedMethod}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all sales and rental transactions
          </p>
        </div>

        <div>
          <Button onClick={() => navigate("/checkout")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Filter Options */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>
            Filter transactions by date range and member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Date Range</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant={
                      selectedDateRange === "all" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateRangeChange("all")}
                  >
                    All Time
                  </Button>
                  <Button
                    variant={
                      selectedDateRange === "30days" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateRangeChange("30days")}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant={
                      selectedDateRange === "60days" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateRangeChange("60days")}
                  >
                    Last 60 Days
                  </Button>
                  <Button
                    variant={
                      selectedDateRange === "90days" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateRangeChange("90days")}
                  >
                    Last 90 Days
                  </Button>
                  <Button
                    variant={
                      selectedDateRange === "custom" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateRangeChange("custom")}
                  >
                    <CalendarRange className="h-4 w-4 mr-2" />
                    Custom Range
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="member-search">Search by Member</Label>
                <div className="relative mt-2">
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
                        {selectedMember
                          ? selectedMember.name
                          : "Search for a member..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      {/* Custom search component */}
                      <div className="overflow-hidden rounded-md border border-slate-100 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                        <div className="flex flex-col">
                          <div className="flex items-center border-b px-3 dark:border-slate-800">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              ref={searchInputRef}
                              value={memberSearchQuery}
                              onChange={(e) => {
                                const value = e.target.value;
                                setMemberSearchQuery(value);
                                handleMemberSearch(value);
                              }}
                              placeholder="Search members..."
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              autoComplete="off"
                            />
                          </div>
                          {isSearchingMembers ? (
                            <div className="py-6 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Searching members...
                              </p>
                            </div>
                          ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                              {memberSearchResults.length === 0 ? (
                                <p className="p-4 text-sm text-center text-slate-500">
                                  No members found.
                                </p>
                              ) : (
                                <div className="p-1">
                                  {memberSearchResults.map((member) => (
                                    <div
                                      key={member.id}
                                      onClick={() => handleMemberSelect(member)}
                                      className="relative flex cursor-default select-none items-center rounded-sm p-2 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800"
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                          <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            {member.name}
                                          </p>
                                          <p className="text-sm text-muted-foreground truncate">
                                            {member.email}{" "}
                                            {member.phone &&
                                              `• ${member.phone}`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedMember && (
                    <Button
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={clearMemberFilter}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom date inputs - only show when custom is selected */}
            {showCustomDateInputs && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 space-x-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Filters
              </Button>
              {selectedDateRange === "custom" && (
                <Button onClick={applyFilters}>Apply Filters</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {isBookStore ? "Sales" : "Borrowing"} Transactions
            </CardTitle>
            <CardDescription>
              {isBookStore
                ? "List of all sales and rental transactions"
                : "List of all borrowing transactions"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {filteredTransactions.length > 0 && (
              <Badge variant="outline">
                {filteredTransactions.length}{" "}
                {filteredTransactions.length === 1
                  ? "transaction"
                  : "transactions"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && page === 0 ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">
                Loading transactions...
              </p>
            </div>
          ) : (
            <>
              {filteredTransactions.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-normal bg-background"
                            >
                              {transaction.memberName || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getPaymentMethodDisplay(
                              transaction.payment_method,
                            )}
                          </TableCell>
                          <TableCell>
                            ${transaction.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                transaction.status === "Completed"
                                  ? "bg-green-100 text-green-600 border-green-200"
                                  : "bg-amber-100 text-amber-600 border-amber-200"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTransaction(transaction)}
                              className="hover:bg-muted"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No transactions found
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isBookStore
                      ? "No sales or rental transactions have been recorded yet."
                      : "No borrowing transactions have been recorded yet."}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/checkout")}
                  >
                    {isBookStore ? "Create New Sale" : "Create New Borrowing"}
                  </Button>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && filteredTransactions.length > 0 && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreTransactions}
                    disabled={isLoading}
                    className="w-full md:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load More</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Transaction #{selectedTransaction?.id.substring(0, 8)} -{" "}
              {new Date(selectedTransaction?.date || "").toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg border">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Payment Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Method:</span>
                      <span className="font-medium">
                        {formatPaymentMethod(
                          selectedTransaction.payment_method,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge
                        className={
                          selectedTransaction.status === "Completed"
                            ? "bg-green-100 text-green-600 border-green-200"
                            : "bg-amber-100 text-amber-600 border-amber-200"
                        }
                      >
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Amount:</span>
                      <span className="font-medium">
                        ${selectedTransaction.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Name:</span>
                      <span className="font-medium">
                        {selectedTransaction.memberName || "Unknown"}
                      </span>
                    </div>
                    {selectedTransaction.memberEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm">Email:</span>
                        <span className="font-medium">
                          {selectedTransaction.memberEmail}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm">Date:</span>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {new Date(
                            selectedTransaction.date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Transaction Items */}
              <div>
                <h3 className="text-lg font-medium mb-3">Items</h3>

                {isLoadingItems ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">
                      Loading items...
                    </p>
                  </div>
                ) : transactionItems.length > 0 ? (
                  <div className="space-y-3">
                    {transactionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center p-3 bg-muted/10 rounded-md border"
                      >
                        <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0 mr-3">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <h4 className="font-medium truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center text-sm">
                              <span className="text-muted-foreground">
                                ${item.price.toFixed(2)} × {item.quantity}
                              </span>
                              <span className="mx-2">=</span>
                              <span className="font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {item.return_status && (
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className={
                                  item.return_status === "Returned"
                                    ? "bg-green-50 text-green-600 border-green-100"
                                    : "bg-blue-50 text-blue-600 border-blue-100"
                                }
                              >
                                {item.return_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between py-2 font-medium">
                      <span>Total</span>
                      <span>
                        ${selectedTransaction.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <p className="text-muted-foreground">
                      No items found for this transaction.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setTransactionDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
