// noinspection ExceptionCaughtLocallyJS

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Book,
  BookCategory,
  BookStatus,
  Member,
  TransactionStatus,
} from "@/lib/types";
import {
  BookOpen,
  Check,
  CheckCircle,
  CheckCircle2,
  Library,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthStatusProvider";
import { Link } from "react-router-dom";

interface CheckoutItem {
  id: string;
  quantity: number;
  title: string;
  price: number;
  return_status?: string;
}

interface ExtendedCheckoutTransaction {
  id: string;
  customer_id: string;
  status: TransactionStatus;
  payment_method: string;
  total_amount: number;
  date: string;
  checkout_items: CheckoutItem[];
  notes?: string;
}

interface Borrowing {
  id: string;
  book_id: string;
  member_id: string;
  checkout_date: string;
  due_date: string;
  return_date?: string;
  status: "Borrowed" | "Returned";
  books: {
    id: string;
    title: string;
    author: string;
    cover_image: string;
  };
}

interface MemberDetailProps {
  memberId: string;
  onClose: () => void;
}

const MemberDetail = ({ memberId, onClose }: MemberDetailProps) => {
  const { userRole } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [checkoutHistory, setCheckoutHistory] = useState<
    ExtendedCheckoutTransaction[]
  >([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Borrowing[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [assignBookOpen, setAssignBookOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignType, setAssignType] = useState<"borrow" | "purchase">("borrow");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReturning, setIsReturning] = useState<{ [key: string]: boolean }>(
    {},
  );
  const { toast } = useToast();

  const [isMemberLoading, setIsMemberLoading] = useState(true);
  const [isBorrowedBooksLoading, setIsBorrowedBooksLoading] = useState(true);
  const [isCheckoutHistoryLoading, setIsCheckoutHistoryLoading] =
    useState(true);

  const cache = useRef({
    member: null as Member | null,
    borrowedBooks: [] as Borrowing[],
    checkoutHistory: [] as ExtendedCheckoutTransaction[],
  });

  const isBookStore = userRole === "Book Store";
  const borrowText = isBookStore ? "Rent" : "Borrow";
  const borrowedText = isBookStore ? "Rented" : "Borrowed";

  const fetchMemberDetails = async () => {
    setIsMemberLoading(true);
    try {
      if (cache.current.member && cache.current.member.id === memberId) {
        setMember(cache.current.member);
        setIsMemberLoading(false);
      } else {
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("id", memberId)
          .single();

        if (memberError) throw memberError;

        cache.current.member = memberData as Member;
        setMember(memberData as Member);
        setIsMemberLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: "Error loading member details",
        description: errorMessage,
      });
    }
  };

  const fetchBorrowedBooks = async () => {
    setIsBorrowedBooksLoading(true);
    try {
      if (
        cache.current.borrowedBooks.length > 0 &&
        cache.current.member?.id === memberId
      ) {
        setBorrowedBooks(cache.current.borrowedBooks);
        setIsBorrowedBooksLoading(false);
      } else {
        const { data: borrowingsData, error: borrowingsError } = await supabase
          .from("borrowings")
          .select("*, books:book_id(*)")
          .eq("member_id", memberId)
          .eq("status", "Borrowed");

        if (borrowingsError) throw borrowingsError;

        cache.current.borrowedBooks = borrowingsData as Borrowing[];
        setBorrowedBooks(borrowingsData as Borrowing[]);
        setIsBorrowedBooksLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: "Error loading borrowed books",
        description: errorMessage,
      });
    }
  };

  const fetchCheckoutHistory = async () => {
    setIsCheckoutHistoryLoading(true);
    try {
      if (
        cache.current.checkoutHistory.length > 0 &&
        cache.current.member?.id === memberId
      ) {
        setCheckoutHistory(cache.current.checkoutHistory);
      } else {
        const { data: checkoutData, error: checkoutError } = await supabase
          .from("checkout_transactions")
          .select("*, checkout_items(*)")
          .eq("customer_id", memberId)
          .order("date", { ascending: false });

        if (checkoutError) throw checkoutError;
        cache.current.checkoutHistory =
          checkoutData as ExtendedCheckoutTransaction[];
        setCheckoutHistory(checkoutData as ExtendedCheckoutTransaction[]);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: "Error loading checkout history",
        description: errorMessage,
      });
    } finally {
      setIsCheckoutHistoryLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .eq("status", "Available")
        .gt("stock", 0)
        .eq("user_id", userId);

      if (booksError) throw booksError;

      const typedBooks: Book[] = booksData.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category as BookCategory,
        publicationYear: book.publication_year,
        publisher: book.publisher,
        description: book.description || "",
        price: book.price,
        status: book.status as BookStatus,
        coverImage: book.cover_image || "",
        stock: book.stock,
        location: book.location,
        language: book.language,
        rating: book.rating,
        pageCount: book.page_count,
        tags: book.tags,
        salesCount: book.sales_count || 0,
      }));

      setAvailableBooks(typedBooks);

      const uniqueCategories = Array.from(
        new Set(typedBooks.map((book) => book.category)),
      );
      setCategories(uniqueCategories);
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: "Error loading member details",
        description: errorMessage,
      });
    }
  };

  useEffect(() => {
    fetchMemberDetails();
    fetchBorrowedBooks();
    fetchCheckoutHistory();
    fetchAvailableBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, toast]);

  useEffect(() => {
    return () => {};
  }, []);

  const getFilteredBooks = () => {
    return availableBooks.filter(
      (book) =>
        (searchQuery === "" ||
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (categoryFilter === "all" ||
          categoryFilter === "" ||
          book.category === categoryFilter),
    );
  };
  const filteredBooks = getFilteredBooks();

  const checkExistingBorrowing = async (bookId: string) => {
    const { data, error } = await supabase
      .from("borrowings")
      .select("*")
      .eq("member_id", memberId)
      .eq("book_id", bookId)
      .eq("status", "Borrowed")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return !!data;
  };

  const handleAssignBook = async () => {
    if (selectedBookIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No book selected",
        description: "Please select at least one book to assign to the member",
      });
      return;
    }

    setIsAssigning(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      for (const bookId of selectedBookIds) {
        const isAlreadyBorrowed = await checkExistingBorrowing(bookId);
        if (isAlreadyBorrowed) {
          toast({
            title: `Already ${borrowedText.toLowerCase()}`,
            description: `This member has already ${borrowedText.toLowerCase()} one of the selected books`,
            className: "text-amber-600",
          });
          continue;
        }

        const selectedBook = availableBooks.find((book) => book.id === bookId);
        if (!selectedBook) continue;

        if (assignType === "borrow") {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);

          const { error: borrowError } = await supabase
            .from("borrowings")
            .insert([
              {
                book_id: bookId,
                member_id: memberId,
                due_date: dueDate.toISOString(),
                status: "Borrowed",
                checkout_date: new Date().toISOString(),
                user_id: userId,
              },
            ]);

          if (borrowError) throw borrowError;

          const { error: checkoutError } = await supabase
            .from("checkout_transactions")
            .insert([
              {
                customer_id: memberId,
                status: "Completed" as TransactionStatus,
                payment_method: isBookStore ? "Rent" : "Borrow",
                total_amount: 0,
                date: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (checkoutError) throw checkoutError;
        } else {
          const { error: checkoutError } = await supabase
            .from("checkout_transactions")
            .insert([
              {
                customer_id: memberId,
                status: "Completed" as TransactionStatus,
                payment_method: "Cash",
                total_amount: selectedBook.price,
                date: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (checkoutError) throw checkoutError;
        }

        const newStock = selectedBook.stock - 1;
        const newStatus = newStock > 0 ? "Available" : "Checked Out";

        const { error: updateError } = await supabase
          .from("books")
          .update({
            stock: newStock,
            status: newStatus,
          })
          .eq("id", bookId);

        if (updateError) throw updateError;
      }
      fetchMemberDetails();
      fetchBorrowedBooks();

      toast({
        description: (
          <div className="flex items-center font-medium">
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Books{" "}
            {assignType === "borrow"
              ? borrowedText.toLowerCase()
              : "purchased"}{" "}
            successfully
          </div>
        ),
        className: "text-green-600",
      });

      setAssignBookOpen(false);
      setSelectedBookIds([]);
      setAssignType("borrow");
      setCategoryFilter("");
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: "Failed to assign book",
        description: errorMessage,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBookReturn = async (
    borrowingId: string,
    bookId: string,
    bookTitle: string,
  ) => {
    setIsReturning({ ...isReturning, [borrowingId]: true });
    try {
      const { error: borrowingError } = await supabase
        .from("borrowings")
        .update({
          status: "Returned",
          return_date: new Date().toISOString(),
        })
        .eq("id", borrowingId);

      if (borrowingError) throw borrowingError;

      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("stock")
        .eq("id", bookId)
        .single();

      if (bookError) throw bookError;

      const { error: updateError } = await supabase
        .from("books")
        .update({
          stock: (bookData.stock || 0) + 1,
          status: "Available",
        })
        .eq("id", bookId);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from("checkout_transactions")
        .insert([
          {
            customer_id: memberId,
            status: "Completed" as TransactionStatus,
            payment_method: "Return",
            total_amount: 0,
            date: new Date().toISOString(),
            notes: `Returned: ${bookTitle}`,
          },
        ]);

      if (transactionError) throw transactionError;
      fetchMemberDetails();
      fetchBorrowedBooks();

      toast({
        description: (
          <div className="flex items-center font-medium">
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Book returned successfully
          </div>
        ),
        className: "text-green-600",
      });
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: "Failed to return book",
        description: errorMessage,
      });
    } finally {
      setIsReturning({ ...isReturning, [borrowingId]: false });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800";
      case "Inactive":
        return "bg-zinc-100 text-zinc-800";
      case "Suspended":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };
  const handleToggleBookSelection = (bookId: string) => {
    setSelectedBookIds((prev) => {
      if (prev.includes(bookId)) {
        return prev.filter((id) => id !== bookId);
      } else {
        if (prev.length >= 5) {
          toast({
            title: "Selection limit reached",
            description: "You can select up to 5 books at a time",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, bookId];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          {isMemberLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mt-2"></div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{member?.name}</h2>
              <Badge className={getStatusColor(member?.status || "Inactive")}>
                {member?.status}
              </Badge>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="borrowed" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="borrowed">Currently {borrowedText}</TabsTrigger>
          <TabsTrigger value="history">Checkout History</TabsTrigger>
          <TabsTrigger value="details">Member Details</TabsTrigger>
        </TabsList>

        <TabsContent value="borrowed" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">{borrowedText} Books</h3>
            <div className="flex gap-2">
              {userRole === "Library" && (
                <Link to="/book-circulation">
                  <Button variant="outline" size="sm">
                    <RefreshCcw className="h-4 w-4 mr-2" /> Book Circulation
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => setAssignBookOpen(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Assign Book
              </Button>
            </div>
          </div>

          {isBorrowedBooksLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-12 bg-gray-300 rounded flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-300 rounded self-center"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : borrowedBooks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {borrowedBooks.map((borrowing) => (
                <Card key={borrowing.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-12 bg-muted flex items-center justify-center flex-shrink-0">
                        {borrowing.books.cover_image ? (
                          <img
                            src={borrowing.books.cover_image}
                            alt={borrowing.books.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{borrowing.books.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {borrowing.books.author}
                        </p>
                        <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                          <span>
                            {borrowedText}:{" "}
                            {new Date(
                              borrowing.checkout_date,
                            ).toLocaleDateString()}
                          </span>
                          <span
                            className={
                              new Date(borrowing.due_date) < new Date()
                                ? "text-red-500 font-medium"
                                : ""
                            }
                          >
                            Due:{" "}
                            {new Date(borrowing.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBookReturn(
                            borrowing.id,
                            borrowing.book_id,
                            borrowing.books.title,
                          )
                        }
                        disabled={isReturning[borrowing.id]}
                        className="self-center"
                      >
                        {isReturning[borrowing.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Return
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/10">
              <Library className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 font-medium">No Books {borrowedText}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This member hasn't {borrowedText.toLowerCase()} any books yet
              </p>
              <Button
                onClick={() => setAssignBookOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" /> Assign Book
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-medium">Checkout History</h3>

          {isCheckoutHistoryLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-6 bg-gray-300 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-6 bg-gray-300 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : checkoutHistory.length > 0 ? (
            <div className="space-y-4">
              {checkoutHistory.map((transaction) => (
                <Card key={transaction.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">
                          Transaction #{transaction.id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(transaction.date).toLocaleDateString()} -
                          <Badge
                            className="ml-2"
                            variant={
                              transaction.status === "Completed"
                                ? "default"
                                : "outline"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(transaction.total_amount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.payment_method === "Borrow" &&
                          isBookStore
                            ? "Rent"
                            : transaction.payment_method}
                          {transaction.payment_method === "Return" && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              <Check className="mr-1 h-3 w-3" /> Returned Book
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {transaction.payment_method === "Return" ? (
                      <div className="text-sm">
                        {transaction.notes &&
                        transaction.notes.startsWith("Returned:") ? (
                          <div className="flex items-center text-emerald-700">
                            <Check className="mr-2 h-4 w-4" />
                            {transaction.notes}
                          </div>
                        ) : (
                          <div className="flex items-center text-emerald-700">
                            <Check className="mr-2 h-4 w-4" />
                            Returned Book
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {transaction.checkout_items &&
                          transaction.checkout_items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <div className="flex items-center">
                                <span>
                                  {item.quantity}x {item.title}
                                </span>
                                {item.return_status === "Returned" && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                  >
                                    <Check className="mr-1 h-3 w-3" /> Returned
                                  </Badge>
                                )}
                              </div>
                              <span>
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/10">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 font-medium">No Purchase History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This member hasn't made any purchases yet
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Member Information</CardTitle>
                  <CardDescription>
                    Personal details and account information
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMemberLoading ? (
                <div className="grid grid-cols-2 gap-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </h4>
                    <p>{member?.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Email
                    </h4>
                    <p>{member?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Phone
                    </h4>
                    <p>{member?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Address
                    </h4>
                    <p>{member?.address || "Not provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h4>
                    <Badge
                      className={getStatusColor(member?.status || "Inactive")}
                    >
                      {member?.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Joined Date
                    </h4>
                    <p>
                      {new Date(
                        member?.joined_date || new Date(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignBookOpen} onOpenChange={setAssignBookOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Book to {member?.name}</DialogTitle>
            <DialogDescription>
              Select up to 5 books to assign to this member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Assignment Type</Label>

              <RadioGroup
                value={assignType}
                onValueChange={(value) =>
                  setAssignType(value as "borrow" | "purchase")
                }
                className="flex gap-4 mt-2"
              >
                <div className="flex-1">
                  <div className="relative">
                    <RadioGroupItem
                      value="borrow"
                      id="borrow"
                      className="sr-only peer"
                    />
                    <Label
                      htmlFor="borrow"
                      className="flex h-10 w-full items-center justify-center bg-black dark:bg-white text-white dark:text-black gap-2 rounded-md border-2 cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary peer-checked:font-medium transition-colors relative"
                    >
                      {assignType === "borrow" && (
                        <div className="absolute left-2">
                          <CheckCircle className="h-4 w-4 text-white dark:text-black" />
                        </div>
                      )}{" "}
                      {isBookStore ? "Rent" : "Borrow"}
                    </Label>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <RadioGroupItem
                      value="purchase"
                      id="purchase"
                      className="sr-only peer"
                    />
                    <Label
                      htmlFor="purchase"
                      className="flex h-10 w-full items-center justify-center bg-black dark:bg-white text-white dark:text-black gap-2 rounded-md border-2 cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary peer-checked:font-medium transition-colors relative"
                    >
                      {assignType === "purchase" && (
                        <div className="absolute left-2">
                          <CheckCircle className="h-4 w-4 text-white dark:text-black" />
                        </div>
                      )}
                      Purchase
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-1/3">
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-[300px] overflow-y-auto space-y-2">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <Card
                    key={book.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBookIds.includes(book.id) ? "border-primary" : ""
                    }`}
                    onClick={() => handleToggleBookSelection(book.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-20 w-16 bg-muted flex items-center justify-center flex-shrink-0">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{book.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {book.author}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {book.stock} available
                            </Badge>
                            {assignType === "purchase" && (
                              <Badge variant="outline" className="text-xs">
                                ${book.price}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedBookIds.includes(book.id) && (
                          <CheckCircle2 className="h-5 w-5 text-primary self-center" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p>No books match your search criteria</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {selectedBookIds.length > 0 && (
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected Books ({selectedBookIds.length}/5):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBookIds.map((id) => {
                      const book = availableBooks.find((b) => b.id === id);
                      return book ? (
                        <Badge
                          key={id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {book.title}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookSelection(id);
                            }}
                            className="ml-1 rounded-full hover:bg-muted p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignBookOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignBook}
              disabled={selectedBookIds.length === 0 || isAssigning}
            >
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {assignType === "borrow" ? borrowText : "Purchase"}{" "}
              {selectedBookIds.length > 1 ? "Books" : "Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDetail;
